/*
Copyright © 2022 NAME HERE <EMAIL ADDRESS>

*/
package cmd

import (
	"fmt"
	"github.com/spf13/cobra"
	"gonitor/web"
	"io/ioutil"
	"os"
	"os/exec"
)

//var daemon bool
// startCmd represents the start command
var startCmd = &cobra.Command{
	Use:   "start",
	Short: "启动脚本监控器",
	Long:  CmdLogo,
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println(CmdLogo)
		//fmt.Printf("\x1b[%d;%dm\n %s \x1b[0m\n", 44, 33, CmdLogo)
		fmt.Println("start called")
		daemon, _ := cmd.Flags().GetBool("daemon")
		if daemon {
			command := exec.Command(os.Args[0], os.Args[1]) //os.Args[1:]...)
			command.Start()
			fmt.Printf("gonne start, [PID] %d running...\n", command.Process.Pid)
			ioutil.WriteFile("gonne.lock", []byte(fmt.Sprintf("%d", command.Process.Pid)), 0666)
			daemon = false
			os.Exit(0)
		}
		fmt.Println("start")
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
