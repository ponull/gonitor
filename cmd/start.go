/*
Copyright © 2022 NAME HERE <EMAIL ADDRESS>

*/
package cmd

import (
	"fmt"
	"github.com/spf13/cobra"
	"gonitor/web"
	"log"
	"os"
)

//var daemon bool
// startCmd represents the start command
var startCmd = &cobra.Command{
	Use:   "start",
	Short: "启动脚本监控器",
	Long:  CmdLogo,
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println(CmdLogo)
		fmt.Println("start called")
		daemon, _ := cmd.Flags().GetBool("daemon")
		fp, _ := os.OpenFile("run.log", os.O_WRONLY|os.O_CREATE|os.O_APPEND, 0644)
		log.SetOutput(fp)
		if daemon {
			//command := exec.Command(os.Args[0], os.Args[1]) //os.Args[1:]...)
			//log.Println(os.Args)
			//command.Start()
			//log.Printf("gonitor start, [PID] %d running...\n", command.Process.Pid)
			//ioutil.WriteFile("gonitor.lock", []byte(fmt.Sprintf("%d", command.Process.Pid)), 0666)
			//daemon = false
			//os.Exit(0)
			fmt.Println("deamon")
		}
		log.Println("start")
		web.StartService()
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

//func fire() {
//	daemon, _ := startCmd.Flags().GetBool("daemon")
//}
