package bootstrap

import (
	"fmt"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"gonitor/core"
	"gonitor/model"
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
		fmt.Printf("database does not exist\n")
		_, err := os.Create(core.Config.Sqlite.DbPath)
		if err != nil {
			log.Panic("Unable to create database")
		}
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
}
