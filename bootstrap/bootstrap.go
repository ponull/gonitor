package bootstrap

import (
	"errors"
	"fmt"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/mysql"
	_ "github.com/jinzhu/gorm/dialects/postgres"
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
	driver := core.Config.Database.Driver
	dsn := core.Config.Database.DSN

	var db *gorm.DB
	var err error

	switch driver {
	case "sqlite3":
		if _, statErr := os.Stat(dsn); statErr != nil {
			fmt.Printf("未找到数据库\n")
			fmt.Printf("新建空数据库\n")
			_, createErr := os.Create(dsn)
			if createErr != nil {
				fmt.Printf("创建数据库失败\n%s\n", createErr)
			}
			fmt.Printf("创建数据库成功\n")
		}
		db, err = gorm.Open("sqlite3", dsn)
	case "mysql":
		db, err = gorm.Open("mysql", dsn)
	case "postgres":
		db, err = gorm.Open("postgres", dsn)
	default:
		panic(fmt.Sprintf("不支持的数据库类型: %s (支持: sqlite3, mysql, postgres)", driver))
	}

	if err != nil {
		log.Printf("Unable to connect to the database (%s): %v\n", driver, err)
		panic(err)
	}
	fmt.Printf("数据库连接成功 (%s)\n", driver)

	if core.Config.App.DbLog {
		db.LogMode(true)
	}
	db.AutoMigrate(&model.Task{})
	db.AutoMigrate(&model.TaskLog{})
	db.AutoMigrate(&model.User{})
	db.AutoMigrate(&model.UserToken{})
	db.AutoMigrate(&model.OperationLog{})
	db.AutoMigrate(&model.Node{})
	db.AutoMigrate(&model.NodeEvent{})
	core.Db = db

	//检查是否有主节点 没有就创建
	masterNode := &model.Node{}
	dbRtNode := db.Where("is_master = ?", true).First(masterNode)
	if dbRtNode.Error != nil && errors.Is(dbRtNode.Error, gorm.ErrRecordNotFound) {
		fmt.Println("未找到主节点，准备初始化")
		masterNode.Name = "主节点"
		masterNode.Region = "本地"
		masterNode.IsMaster = true
		masterNode.Status = 1
		masterNode.Remark = "默认主控节点"
		dbRtNode = db.Create(masterNode)
		if dbRtNode.Error != nil {
			fmt.Println("创建主节点失败")
		} else {
			fmt.Println("创建主节点成功")
		}
	}

	//检查是否有admin这个用户 没有就加入
	adminUser := &model.User{}
	dbRt := db.Where("login_account = ?", "admin").First(adminUser)
	if dbRt.Error != nil && errors.Is(dbRt.Error, gorm.ErrRecordNotFound) {
		fmt.Println("未找到admin用户，准备初始化")
		adminUser.LoginAccount = "admin"
		hashedPassword, err := utils.HashPassword("123456")
		if err != nil {
			fmt.Println("密码加密失败")
			return
		}
		adminUser.Password = hashedPassword
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
