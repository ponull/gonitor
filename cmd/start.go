// Package cmd /*
package cmd

import (
	"fmt"
	"github.com/spf13/cobra"
	"gonitor/core"
	"gonitor/task"
	"gonitor/web"
	"io/ioutil"
	"log"
	"os"
	"os/exec"
	"os/signal"
	"syscall"
	"time"
)

// logShutdownEvent writes a shutdown event to a local log file.
// This ensures events are recorded even when HTTP reporting fails.
func logShutdownEvent(sigName string) {
	eventLog := fmt.Sprintf("[%s] signal=%s version=%s component=%s\n",
		time.Now().Format("2006-01-02 15:04:05"), sigName, core.Version, core.Component)
	logDir := "tmp"
	if err := os.MkdirAll(logDir, 0755); err != nil {
		log.Printf("无法创建事件日志目录: %v", err)
		return
	}
	logFile := logDir + "/events.log"
	f, err := os.OpenFile(logFile, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Printf("无法写入事件日志: %v", err)
		return
	}
	defer f.Close()
	f.WriteString(eventLog)
}

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
		log.Printf("gonitor %s 启动中 (version=%s, commit=%s, built=%s)\n",
			core.Component, core.Version, core.GitCommit, core.BuildTime)
		err := task.Manager.Start()
		if err != nil {
			fmt.Println("gonitor 启动失败:", err.Error())
			return
		}
		web.StartService()
		c := make(chan os.Signal, 1)
		signal.Notify(c, os.Interrupt, syscall.SIGTERM, syscall.SIGHUP, syscall.SIGQUIT)

		s := <-c
		fmt.Println()
		fmt.Println("-----------------Stop---------------")
		fmt.Printf("Got signal: %v\n", s)

		// 记录关机事件到本地日志，防止来不及发送HTTP请求
		logShutdownEvent(s.String())

		fmt.Println("Stopping tasks...")
		task.Manager.Stop()

		fmt.Printf("gonitor %s stopped gracefully\n", core.Component)
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
