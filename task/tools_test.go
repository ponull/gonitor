package task

import (
	"testing"
)

func TestCheckTaskScheduleValid(t *testing.T) {
	validSchedules := []string{
		"* * * * *",
		"0 0 * * *",
		"*/5 * * * *",
		"0 12 * * 1-5",
		"@hourly",
		"@daily",
		"@weekly",
		"@monthly",
		"@yearly",
		"@every 5m",
		"@every 1h30m",
	}
	for _, schedule := range validSchedules {
		err := CheckTaskSchedule(schedule)
		if err != nil {
			t.Errorf("CheckTaskSchedule(%q) returned error: %v", schedule, err)
		}
	}
}

func TestCheckTaskScheduleInvalid(t *testing.T) {
	invalidSchedules := []string{
		"",
		"invalid",
		"* * *",
		"60 * * * *",
		"abc def ghi jkl mno",
	}
	for _, schedule := range invalidSchedules {
		err := CheckTaskSchedule(schedule)
		if err == nil {
			t.Errorf("CheckTaskSchedule(%q) should return error for invalid schedule", schedule)
		}
	}
}

func TestCheckTaskAssertJavascriptCodeValid(t *testing.T) {
	validCode := `function main(output) { return output.includes("success"); }`
	err := CheckTaskAssertJavascriptCode(validCode)
	if err != nil {
		t.Errorf("CheckTaskAssertJavascriptCode() returned error for valid code: %v", err)
	}
}

func TestCheckTaskAssertJavascriptCodeInvalid(t *testing.T) {
	invalidCode := `function main(output { return output.includes("success"); }`
	err := CheckTaskAssertJavascriptCode(invalidCode)
	if err == nil {
		t.Error("CheckTaskAssertJavascriptCode() should return error for invalid JS code")
	}
}

func TestCheckTaskAssertJavascriptCodeNoMain(t *testing.T) {
	codeWithoutMain := `function helper(output) { return true; }`
	err := CheckTaskAssertJavascriptCode(codeWithoutMain)
	if err == nil {
		t.Error("CheckTaskAssertJavascriptCode() should return error when main function is not defined")
	}
}

func TestGetTaskAssertResultTrue(t *testing.T) {
	output := "success"
	jsCode := `function main(output) { return output === "success"; }`
	result := GetTaskAssertResult(output, jsCode)
	if !result {
		t.Error("GetTaskAssertResult() should return true for matching assertion")
	}
}

func TestGetTaskAssertResultFalse(t *testing.T) {
	output := "failure"
	jsCode := `function main(output) { return output === "success"; }`
	result := GetTaskAssertResult(output, jsCode)
	if result {
		t.Error("GetTaskAssertResult() should return false for non-matching assertion")
	}
}

func TestGetTaskAssertResultInvalidCode(t *testing.T) {
	output := "some output"
	jsCode := `this is not valid javascript`
	result := GetTaskAssertResult(output, jsCode)
	if result {
		t.Error("GetTaskAssertResult() should return false for invalid JS code")
	}
}

func TestGetTaskAssertResultPanicRecovery(t *testing.T) {
	output := "some output"
	// This code will panic when trying to call main as a function
	jsCode := `var main = "not a function";`
	result := GetTaskAssertResult(output, jsCode)
	if result {
		t.Error("GetTaskAssertResult() should return false and recover from panic")
	}
}

func TestParseTaskCmd(t *testing.T) {
	command, args := parseTask("echo hello", CmdTask)
	if command != "bash" {
		t.Errorf("parseTask() command = %q for CmdTask, expected 'bash'", command)
	}
	if len(args) != 2 || args[0] != "-c" || args[1] != "echo hello" {
		t.Errorf("parseTask() args = %v for CmdTask, expected ['-c', 'echo hello']", args)
	}
}

func TestParseTaskHttp(t *testing.T) {
	command, args := parseTask("https://example.com", HttpTask)
	if command != "curl" {
		t.Errorf("parseTask() command = %q for HttpTask, expected 'curl'", command)
	}
	if len(args) != 2 || args[0] != "-L" || args[1] != "https://example.com" {
		t.Errorf("parseTask() args = %v for HttpTask, expected ['-L', 'https://example.com']", args)
	}
}

func TestParseTaskFile(t *testing.T) {
	command, args := parseTask("/tmp/test.py", FileTask)
	if command != "python" {
		t.Errorf("parseTask() command = %q for FileTask .py, expected 'python'", command)
	}
	if len(args) != 1 || args[0] != "/tmp/test.py" {
		t.Errorf("parseTask() args = %v for FileTask .py, expected ['/tmp/test.py']", args)
	}
}

func TestParseTaskFileJs(t *testing.T) {
	command, args := parseTask("/tmp/test.js", FileTask)
	if command != "node" {
		t.Errorf("parseTask() command = %q for FileTask .js, expected 'node'", command)
	}
	if len(args) != 1 || args[0] != "/tmp/test.js" {
		t.Errorf("parseTask() args = %v for FileTask .js, expected ['/tmp/test.js']", args)
	}
}
