/*
Copyright © 2022 NAME HERE <EMAIL ADDRESS>

*/
package cmd

import (
	"fmt"
	"github.com/spf13/cobra"
	"gonitor/core"
	"gonitor/web"
	"io/ioutil"
	"log"
	"os"
	"os/exec"
	"os/signal"
)

//var daemon bool
// startCmd represents the start command
var startCmd = &cobra.Command{
	Use:   "start",
	Short: "启动脚本监控器",
	Long:  CmdLogo,
	Run: func(cmd *cobra.Command, args []string) {
		daemon, _ := cmd.Flags().GetBool("daemon")
		if daemon {
			fmt.Println(CmdLogo)
			command := exec.Command(os.Args[0], "start") //os.Args[1:]...)
			err := command.Start()
			if err != nil {
				fmt.Println("gonitor 启动失败:", err.Error())
				return
			}
			fmt.Printf("gonitor 守护进程启动成功, [PID] %d running...\n", command.Process.Pid)
			ioutil.WriteFile("gonitor.lock", []byte(fmt.Sprintf("%d", command.Process.Pid)), 0666)
			daemon = false
			os.Exit(0)
		}
		log.Println("gonitor 启动中")
		//core.InitTask()
		web.StartService()
		c := make(chan os.Signal, 1)
		signal.Notify(c, os.Interrupt, os.Kill)

		s := <-c
		fmt.Println("Got signal:", s)
		core.KillAllRunningTask()
	},
}

func init() {
	rootCmd.AddCommand(startCmd)
	startCmd.Flags().BoolP("daemon", "d", false, "守护进程方式运行")

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// startCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// startCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}
