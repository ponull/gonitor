/*
Copyright © 2022 NAME HERE <EMAIL ADDRESS>

*/
package cmd

import (
	"fmt"
	"github.com/shirou/gopsutil/process"
	"github.com/spf13/cobra"
	"io/ioutil"
	"log"
	"strconv"
)

// stopCmd represents the stop command
var stopCmd = &cobra.Command{
	Use:   "stop",
	Short: "停止脚本监控器",
	Long:  CmdLogo,
	Run: func(cmd *cobra.Command, args []string) {
		fileBytes, err := ioutil.ReadFile("gonitor.lock")
		if err != nil {
			return
		}
		pid, err := strconv.ParseInt(string(fileBytes), 10, 32)
		fmt.Printf("当前运行的进程ID: 【%v】\n", pid)
		pn, err := process.NewProcess(int32(pid))
		if err != nil {
			fmt.Println("获取gonitor进程失败:" + err.Error())
			return
		}
		cmdline, _ := pn.Cmdline()
		log.Println("进程启动参数: ", cmdline)
		err = pn.Kill()
		if err != nil {
			log.Println("gonitor停止失败:" + err.Error())
			return
		}
		log.Println("gonitor已停止")

	},
}

func init() {
	rootCmd.AddCommand(stopCmd)

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// stopCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// stopCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}

func ProcessId() (pid []int32) {
	pids, _ := process.Pids()
	for _, p := range pids {

		pid = append(pid, p)
	}
	return pid
}

func ProcessName() (pname []string) {
	pids, _ := process.Pids()
	for _, pid := range pids {
		pn, _ := process.NewProcess(pid)
		pName, _ := pn.Name()
		pidstr := fmt.Sprintf("%d", pid)
		pname = append(pname, pidstr+"=>"+pName+"\n")
	}
	return pname
}
