package core

import (
	"bufio"
	"bytes"
	"fmt"
	"github.com/robfig/cron/v3"
	"io/ioutil"
	"log"
	"os/exec"
)

var cronIns = cron.New()

//数据库自增任务id作为key  这样方便在web页面操作
var taskList = make(map[int]*cronTask)

type cronTask struct {
	TaskID  int
	Status  int
	EntryID cron.EntryID
	Type    string //http cmd
}

func (c *cronTask) Stop() {
	cronIns.Remove(c.EntryID)
}

type dbTask struct {
	ID         int
	Name       string
	Schedule   string
	Status     int //当前状态
	Command    string
	PID        int
	IsDisabled bool
	Type       string
}

var tempTaskList = []*dbTask{
	&dbTask{
		ID:         1,
		Name:       "通知脚本",
		Schedule:   "@every 1s",
		Status:     0,
		Command:    "echo 111",
		IsDisabled: false,
		Type:       "cmd",
	},
	&dbTask{
		ID:         2,
		Name:       "结算脚本",
		Schedule:   "@every 5s",
		Status:     0,
		Command:    `echo 222`,
		IsDisabled: false,
		Type:       "cmd",
	},
}

func InitTask() {
	for _, taskItem := range tempTaskList {
		taskIns := *taskItem
		entryID, err := cronIns.AddFunc(taskIns.Schedule, func() {
			//log.Println(taskIns.Name)
			//log.Println(taskIns.Command, time.Now().Second())
			cmd := exec.Command(taskIns.Command)
			stderr, _ := cmd.StderrPipe()
			stdout, _ := cmd.StdoutPipe()
			defer stdout.Close()
			if err := cmd.Start(); err != nil {
				fmt.Println("exec the cmd ", taskIns.Name, " failed")
				fmt.Println(err)
				//return
			}

			// 正常日志
			//logScan := bufio.NewScanner(stdout)
			//go func() {
			//	for logScan.Scan() {
			//		fmt.Println(logScan.Text())
			//	}
			//}()

			// 等待命令执行完
			cmd.Wait()
			// 错误日志
			errBuf := bytes.NewBufferString("")
			scan := bufio.NewScanner(stderr)
			//
			for scan.Scan() {
				s := scan.Text()
				fmt.Println("build error: ", s)
				errBuf.WriteString(s)
				errBuf.WriteString("\n")
			}

			if !cmd.ProcessState.Success() {
				// 执行失败，返回错误信息
				fmt.Println(errBuf.String())
			}

			result, err := ioutil.ReadAll(stdout) // 读取输出结果
			if err != nil {
				fmt.Println("错误", err.Error())
			}
			resdata := string(result)
			fmt.Println("输出: ", resdata)

			//cmd := exec.Command(taskIns.Command)
			//stdout, _ := cmd.StdoutPipe() //创建输出管道
			//defer stdout.Close()
			//fmt.Println("当前执行: ", cmd.Args) //查看当前执行命令
			////cmdPid := cmd.Process.Pid //查看命令pid
			////fmt.Println(cmdPid)
			//
			//result, err := ioutil.ReadAll(stdout) // 读取输出结果
			//if err != nil {
			//	fmt.Println("错误", err.Error())
			//}
			//resdata := string(result)
			//fmt.Println("输出: ", resdata)
			//
			//var res int
			//if err := cmd.Wait(); err != nil {
			//	if ex, ok := err.(*exec.ExitError); ok {
			//		fmt.Println("cmd exit status")
			//		res = ex.Sys().(syscall.WaitStatus).ExitStatus() //获取命令执行返回状态，相当于shell: echo $?
			//	}
			//}
			//
			//fmt.Println("输出2", res)

		})
		if err != nil {
			log.Println(taskIns.Name+" error:", err)
			return
		}
		taskList[taskIns.ID] = &cronTask{
			TaskID:  taskIns.ID,
			Status:  0,
			EntryID: entryID,
			Type:    "cmd",
		}
	}
	cronIns.Start()
}
