package bootstrap

import (
	"errors"
	"fmt"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"gonitor/core"
	"gonitor/model"
	"gonitor/utils"
	"log"
	"os"
	"path"
)

func init() {

	core.InitConfig()
	initLog()
	initDb()
}

func initLog() {
	if core.Config.App.Debug {
		return
	}
	err := os.MkdirAll(path.Dir(core.Config.App.LogFile), 0777)
	if err != nil {
		panic(err)
	}
	fp, err := os.OpenFile(core.Config.App.LogFile, os.O_WRONLY|os.O_CREATE|os.O_APPEND, 0644)
	if err != nil {
		panic(err)
	}
	log.SetOutput(fp)
}

func initDb() {
	if _, err := os.Stat(core.Config.Sqlite.DbPath); err != nil {
		fmt.Printf("未找到数据库\n")
		fmt.Printf("新建空数据库\n")
		_, err := os.Create(core.Config.Sqlite.DbPath)
		if err != nil {
			fmt.Printf("创建数据库失败\n%s\n", err)
		}
		fmt.Printf("创建数据库成功\n")
	}
	//db, err := gorm.Open("mysql", "root:123456@tcp(127.0.0.1:3306)/jd_promotion?charset=utf8mb4&parseTime=True&loc=Local")
	db, err := gorm.Open("sqlite3", core.Config.Sqlite.DbPath)
	if err != nil {
		log.Println("Unable to connect to the database")
		panic(err)
	}
	if core.Config.App.DbLog {
		db.LogMode(true)
	}
	db.AutoMigrate(&model.Task{})
	db.AutoMigrate(&model.TaskLog{})
	db.AutoMigrate(&model.User{})
	db.AutoMigrate(&model.UserToken{})
	core.Db = db
	//检查是否有admin这个用户 没有就加入
	adminUser := &model.User{}
	dbRt := db.Where("login_account = ?", "admin").First(adminUser)
	if dbRt.Error != nil && errors.Is(dbRt.Error, gorm.ErrRecordNotFound) {
		fmt.Println("未找到admin用户，准备初始化")
		adminUser.LoginAccount = "admin"
		adminUser.Password = utils.Md5("123456")
		adminUser.Avatar = "https://mui.com/static/images/avatar/1.jpg"
		dbRt = db.Create(adminUser)
		if dbRt.Error != nil {
			fmt.Println("创建admin用户失败")
		} else {
			fmt.Println("创建admin用户成功")
			fmt.Println("用户名: admin")
			fmt.Println("密码: 123456")
		}
		//没有就主动插入admin用户
	}
}
