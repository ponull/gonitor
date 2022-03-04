package core

import (
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"gonitor/model"
	"log"
	"os"
	"path"
)

func init() {

	InitConfig()
	initLog()
	initDb()
}

func initLog() {
	err := os.MkdirAll(path.Dir(Config.App.LogFile), 0777)
	if err != nil {
		panic(err)
	}
	fp, err := os.OpenFile(Config.App.LogFile, os.O_WRONLY|os.O_CREATE|os.O_APPEND, 0644)
	if err != nil {
		panic(err)
	}
	log.SetOutput(fp)
}

func initDb() {
	//db, err := gorm.Open("mysql", "root:123456@tcp(127.0.0.1:3306)/jd_promotion?charset=utf8mb4&parseTime=True&loc=Local")
	db, err := gorm.Open("sqlite3", Config.Sqlite.DbPath)
	if err != nil {
		log.Println("Unable to connect to the database")
		panic(err)
	}
	if Config.App.DbLog {
		db.LogMode(true)
	}
	db.AutoMigrate(&model.Task{})
	db.AutoMigrate(&model.TaskLog{})
	//db.AutoMigrate(&model.JDAccount{})
	//db.AutoMigrate(&model.JDAccountMessage{})
	//db.AutoMigrate(&model.User{})
	//db.AutoMigrate(&model.UserBindAccount{})
	//db.AutoMigrate(&model.UserToken{})
	Db = db
}
