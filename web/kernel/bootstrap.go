package kernel

import (
	"github.com/gin-gonic/gin"
	"github.com/jinzhu/gorm"
	"log"
	//_ "github.com/jinzhu/gorm/dialects/mysql"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"gonitor/web/yogo"
	"gopkg.in/yaml.v3"
	"io/ioutil"
)

func init() {
	initConfig()
	initDb()
	initGin()
}

func initDb() {
	//db, err := gorm.Open("mysql", "root:123456@tcp(127.0.0.1:3306)/jd_promotion?charset=utf8mb4&parseTime=True&loc=Local")
	db, err := gorm.Open("sqlite3", yogo.Config.Sqlite.DbPath)
	if err != nil {
		log.Println("Unable to connect to the database")
		panic(err)
	}
	if yogo.Config.App.DbLog {
		db.LogMode(true)
	}
	//db.AutoMigrate(&model.AppVersion{})
	//db.AutoMigrate(&model.JDAccount{})
	//db.AutoMigrate(&model.JDAccountMessage{})
	//db.AutoMigrate(&model.User{})
	//db.AutoMigrate(&model.UserBindAccount{})
	//db.AutoMigrate(&model.UserToken{})
	yogo.Db = db
}

func initConfig() {
	data, _ := ioutil.ReadFile("config.yml")
	//把yaml形式的字符串解析成struct类型
	err := yaml.Unmarshal(data, &yogo.Config)
	if err != nil {
		panic(err)
	}
	if yogo.Config.Sqlite.DbPath == "" {
		panic("配置文件读取错误")
	}
}

func initGin() {
	if !yogo.Config.App.Debug {
		gin.SetMode(gin.ReleaseMode)
	}
}
