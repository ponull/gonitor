package core

import (
	"log"
	"os"
	"path"
)

func init() {

	InitConfig()
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
