/*
Copyright © 2022 NAME HERE <EMAIL ADDRESS>

*/
package cmd

import (
	"fmt"
	"github.com/shirou/gopsutil/process"
	"github.com/spf13/cobra"
	"io/ioutil"
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
		fmt.Println(string(fileBytes))
		fmt.Println(ProcessName())
		pid, err := strconv.ParseInt(string(fileBytes), 10, 32)
		fmt.Printf("%v", pid)
		pn, _ := process.NewProcess(int32(pid))
		pn.Kill()
		pn.Cmdline()

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
