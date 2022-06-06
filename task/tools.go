package task

import (
	"errors"
	"github.com/dop251/goja"
	"github.com/robfig/cron/v3"
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
		return false
		//return response.Resp().Error(2154646, "JS断言代码有错误", nil)
	}
	var assertFn func(string) bool
	err = vm.ExportTo(vm.Get("main"), &assertFn)
	if err != nil {
		return false
		//return response.Resp().Error(2154646, "JS断言代码main方法格式不正确", nil)
	}
	return assertFn(output)
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
