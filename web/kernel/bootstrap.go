package kernel

import (
	"github.com/gin-gonic/gin"
	"github.com/jinzhu/gorm"
	"gonitor/core"
	"gonitor/web/yogo"
	"log"
	//_ "github.com/jinzhu/gorm/dialects/mysql"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
)

func init() {
	initDb()
	initGin()
}

func initDb() {
	//db, err := gorm.Open("mysql", "root:123456@tcp(127.0.0.1:3306)/jd_promotion?charset=utf8mb4&parseTime=True&loc=Local")
	db, err := gorm.Open("sqlite3", core.Config.Sqlite.DbPath)
	if err != nil {
		log.Println("Unable to connect to the database")
		panic(err)
	}
	if core.Config.App.DbLog {
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

func initGin() {
	if !core.Config.App.Debug {
		gin.SetMode(gin.ReleaseMode)
	}
}
