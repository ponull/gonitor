package task

import (
	"errors"
	"fmt"
	"github.com/dop251/goja"
	"github.com/robfig/cron/v3"
	"gonitor/model"
	"gonitor/service/wecom"
	"log"
)

func CheckTaskAssertJavascriptCode(jsCode string) error {
	vm := goja.New()
	_, err := vm.RunString(jsCode)
	if err != nil {
		return err
		//return response.Resp().Error(2154646, "JS断言代码有错误", nil)
	}
	var assertFn func(string) bool
	err = vm.ExportTo(vm.Get("main"), &assertFn)
	if err != nil {
		return err
		//return response.Resp().Error(2154646, "JS断言代码main方法格式不正确", nil)
	}
	return nil
}

func GetTaskAssertResult(output string, jsCode string) bool {
	vm := goja.New()
	_, err := vm.RunString(jsCode)
	if err != nil {
		log.Println("JS断言代码有错误")
		return false
	}
	var assertFn func(string) bool
	err = vm.ExportTo(vm.Get("main"), &assertFn)
	if err != nil {
		log.Println("JS断言代码main方法格式不正确")
		return false
	}
	return assertFn(output)
}

func ExecResultHandler(taskInfo *model.Task, logInfo *model.TaskLog, resultHandlerCode string) {
	var resultInfo = map[string]interface{}{
		"exec_time":    logInfo.ExecTime.Format("2006-01-02 15:04:05"),
		"running_time": logInfo.RunningTime,
		"retry_times":  logInfo.RetryTimes,
		"task_info": map[string]interface{}{
			"id":            taskInfo.ID,
			"name":          taskInfo.Name,
			"exec_type":     taskInfo.ExecType,
			"command":       taskInfo.Command,
			"exec_strategy": taskInfo.ExecStrategy,
		},
	}
	vm := goja.New()
	_, err := vm.RunString(resultHandlerCode)
	if err != nil {
		log.Println("解析JS结果捕获脚本失败")
	}
	var handlerFn func(result bool, info map[string]interface{}) map[string]interface{}
	err = vm.ExportTo(vm.Get("main"), &handlerFn)
	if err != nil {
		log.Println("JS handler代码main方法格式不正确")
		return
	}
	handlerRt := handlerFn(logInfo.ExecResult, resultInfo)
	fmt.Println(handlerRt)
	if handlerRt["push"].(bool) {
		wecom.SendTextMessage(handlerRt["content"].(string))
	}
}

func CheckTaskSchedule(schedule string) error {
	cronParser := cron.NewParser(
		cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow | cron.Descriptor,
	)
	_, err := cronParser.Parse(schedule)
	if err != nil {
		return errors.New("invalid schedule")
	}
	return nil
}
