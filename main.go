/*
Copyright © 2022 NAME HERE <EMAIL ADDRESS>

*/
package main

import (
	"gonitor/cmd"
	"gonitor/core"
	"log"
	"os"
)

func main() {
	core.InitConfig()
	fp, _ := os.OpenFile(core.Config.App.LogFile, os.O_WRONLY|os.O_CREATE|os.O_APPEND, 0644)
	log.SetOutput(fp)
	cmd.Execute()
}
