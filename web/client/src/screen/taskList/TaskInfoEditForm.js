import {forwardRef, useImperativeHandle, useState} from "react";
import * as React from "react";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import {FormControl, FormLabel, InputLabel, MenuItem, Popover, Radio, RadioGroup, Select, Switch} from "@mui/material";
import FormControlLabel from "@mui/material/FormControlLabel";
import {ExecuteTypeEnum} from "../../enum/task";
import HelpIcon from '@mui/icons-material/Help';
import {oneDark} from '@codemirror/theme-one-dark';
import CodeMirror from '@uiw/react-codemirror';
import {javascript} from "@codemirror/lang-javascript";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";

export const TaskInfoEditForm = forwardRef((props, ref) => {
    const {taskInfo} = props
    useImperativeHandle(ref, () => ({
        getFormValues: getFormValues,
    }));
    const getFormValues = () => {
        return {
            name: taskName,
            exec_type: executeType,
            command,
            schedule,
            retry_times: parseInt(retryTimes),
            retry_interval: parseInt(retryInterval),
            exec_strategy: parseInt(ExecStrategy),
            is_disable: IsDisable,
            assert,
            result_handler: resultHandler,
        }
    }
    const [taskName, setTaskName] = useState(taskInfo.name)
    const handleTaskNameChange = (event) => setTaskName(event.target.value)
    const [executeType, setExecuteType] = useState(taskInfo.exec_type)
    const handleExecuteTypeChange = (event) => {
        const executeType = event.target.value;
        setExecuteType(executeType);
        setCommandLabel(ExecuteTypeEnum.getCommandLabel(executeType));
    };
    const [commandLabel, setCommandLabel] = useState('Http Url (only support GET method)');
    const [command, setCommand] = useState(taskInfo.command);
    const handleCommandChange = (event) => setCommand(event.target.value)
    const [schedule, setSchedule] = useState(taskInfo.schedule)
    const handleScheduleChange = (event) => setSchedule(event.target.value)
    const [retryTimes, setRetryTimes] = useState(taskInfo.retry_times)
    const handleRetryTimesChange = (event) => setRetryTimes(event.target.value)
    const [retryInterval, setRetryInterval] = useState(taskInfo.retry_interval)
    const handleRetryIntervalChange = (event) => setRetryInterval(event.target.value)
    const [ExecStrategy, setExecStrategy] = useState(taskInfo.exec_strategy)
    const handleExecStrategyChange = (event) => setExecStrategy(event.target.value)
    const [IsDisable, setIsDisable] = useState(taskInfo.is_disable)
    const handleIsDisableChange = (event) => setIsDisable(event.target.checked)
    const [assert, setAssert] = useState(taskInfo.assert)
    const handleAssertChange = (code) => setAssert(code)
    const [resultHandler, setResultHandler] = useState(taskInfo.result_handler)
    const handleResultHandlerChange = (code) => setResultHandler(code)
    return (
        <React.Fragment>
            <Typography variant="h6" gutterBottom>
                Task Info
            </Typography>
            <Grid container spacing={3} sx={{mb: 5}}>
                <Grid item xs={12}>
                    <TextField
                        required
                        id="taskName"
                        name="taskName"
                        label="Name"
                        value={taskName}
                        onChange={handleTaskNameChange}
                        fullWidth
                        variant="standard"
                    />
                </Grid>
                <Grid item xs={12}>
                    <FormControl variant="standard" sx={{minWidth: 120}}>
                        <InputLabel id="exec-type-label">Execute Type</InputLabel>
                        <Select
                            labelId="exec-type-label"
                            id="exec-type"
                            value={executeType}
                            onChange={handleExecuteTypeChange}
                            label="Execute Type"
                        >
                            <MenuItem value={ExecuteTypeEnum.HTTP}>
                                {ExecuteTypeEnum.getLanguage(ExecuteTypeEnum.HTTP)}
                            </MenuItem>
                            <MenuItem value={ExecuteTypeEnum.CMD}>
                                {ExecuteTypeEnum.getLanguage(ExecuteTypeEnum.CMD)}
                            </MenuItem>
                            <MenuItem value={ExecuteTypeEnum.FILE}>
                                {ExecuteTypeEnum.getLanguage(ExecuteTypeEnum.FILE)}
                            </MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        required
                        id="command"
                        name="command"
                        label={commandLabel}
                        value={command}
                        onChange={handleCommandChange}
                        fullWidth
                        variant="standard"
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        required
                        id="schedule"
                        name="schedule"
                        label="Schedule"
                        value={schedule}
                        onChange={handleScheduleChange}
                        fullWidth
                        variant="standard"
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        required
                        id="retryTimes"
                        name="retryTimes"
                        label="Retry Times"
                        value={retryTimes}
                        onChange={handleRetryTimesChange}
                        fullWidth
                        variant="standard"
                        inputProps={{inputMode: 'numeric', pattern: '[0-9]*'}}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        required
                        id="address1"
                        name="address1"
                        label="Retry Interval(unit second)"
                        value={retryInterval}
                        onChange={handleRetryIntervalChange}
                        fullWidth
                        variant="standard"
                        inputProps={{inputMode: 'numeric', pattern: '[0-9]*'}}
                    />
                </Grid>
                <Grid item xs={12}>
                    <FormControl>
                        <FormLabel id="demo-radio-buttons-group-label">Execute Strategy (when last task is
                            running)</FormLabel>
                        <RadioGroup
                            aria-labelledby="demo-radio-buttons-group-label"
                            defaultValue={ExecStrategy}
                            name="radio-buttons-group"
                            onChange={handleExecStrategyChange}
                        >
                            <FormControlLabel value={0} control={<Radio/>} label="Parallel"/>
                            <FormControlLabel value={1} control={<Radio/>} label="Skip"/>
                            <FormControlLabel value={2} control={<Radio/>} label="Delay"/>
                        </RadioGroup>
                    </FormControl>
                </Grid>
                <Grid item xs={12}>
                    <FormControlLabel control={<Switch checked={IsDisable} onChange={handleIsDisableChange}/>}
                                      label="Disabled"/>
                </Grid>
                <Grid item xs={12}>
                    <AssertLabel/>
                    <CodeMirror
                        value={assert}
                        height="500px"
                        theme={oneDark}
                        extensions={[javascript({jsx: false, typescript: false})]}
                        onChange={(value, viewUpdate) => {
                            handleAssertChange(value)
                            // console.log('value:', value);
                        }}
                    />
                </Grid>
                <Grid item xs={12}>
                    <ResultHandlerLabel/>
                    <CodeMirror
                        value={resultHandler}
                        height="500px"
                        theme={oneDark}
                        extensions={[javascript({jsx: false, typescript: false})]}
                        onChange={(value, viewUpdate) => {
                            handleResultHandlerChange(value)
                            // console.log('value:', value);
                        }}
                    />
                </Grid>
            </Grid>
        </React.Fragment>
    );
});

const AssertLabel = () => {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const handlePopoverOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    return (
        <React.Fragment>
            <Typography variant="p">
                Assert
                <IconButton
                    aria-owns={open ? 'mouse-over-popover' : undefined}
                    aria-haspopup="true"
                    onMouseEnter={handlePopoverOpen}
                    onMouseLeave={handlePopoverClose}
                >
                    <HelpIcon/>
                </IconButton>
            </Typography>
            <Popover
                id="mouse-over-popover"
                sx={{
                    pointerEvents: 'none',
                }}
                open={open}
                anchorEl={anchorEl}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                onClose={handlePopoverClose}
                disableRestoreFocus
            >
                <Box sx={{ p: 1 ,whiteSpace: "pre-line"}}>
                    <p>Assert is a function that will be executed after the task is finished.</p>
                    <p>为空则不执行</p>
                    <p>方法中必须包含一个main方法，作为主方法，供给系统调用。</p>
                    <p>传入的参数为：output - type string 执行任务之后返回的字符串，无论是json还是html等 全部原样传入</p>
                    <p>返回结果为布尔类型, 返回true系统任务结束， 并记录状态为成功， 返回false会根据执行情况判断是否需要重试</p>
                    <p>其他功能性方法自行添加，比如：</p>
                    <pre>
{`
function main(output) {
    let random = getRandomInt(0,1)
    if(random === 1){
        return true;
    }
    return false;
}
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //不含最大值，含最小值
}
`}
                    </pre>
                </Box>
            </Popover>
        </React.Fragment>
    );
}

const ResultHandlerLabel = () => {
    const [anchorEl, setAnchorEl] = React.useState(null);

    const handlePopoverOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    return (
        <React.Fragment>
            <Typography variant="p">
                Result Handler
                <IconButton
                    aria-owns={open ? 'mouse-over-popover' : undefined}
                    aria-haspopup="true"
                    onMouseEnter={handlePopoverOpen}
                    onMouseLeave={handlePopoverClose}
                >
                    <HelpIcon/>
                </IconButton>
            </Typography>
            <Popover
                id="mouse-over-popover"
                sx={{
                    pointerEvents: 'none',
                }}
                open={open}
                anchorEl={anchorEl}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                onClose={handlePopoverClose}
                disableRestoreFocus
            >
                <Box sx={{ p: 1 ,whiteSpace: "pre-line"}}>
                    <p>Result Handler is a function that will be executed after the task is finished.</p>
                    <p>为空则不执行</p>
                    <p>方法中必须包含一个main方法，作为主方法，供给系统调用。</p>
                    <p>传入的参数1为：result - type bool 执行结果，例如执行命令失败，断言失败等这里都是false，之前前面的步骤全部成功才会为true</p>
                    <p>传入的参数2为：info - type array 执行信息，这个说不清楚 很多数据</p>
                    <p>返回结果为一个对象 需要包含2个key</p>
                    <p>Key1：push bool类型 是否需要推送，这里会推送到配置好的微信企业上面 </p>
                    <p>Key2：content string类型 推送的内容，不需要推送这里就直接传空字符串就好了 </p>
                    <pre>
{`
function main(result, info) {
    const content = \`
任务: \${info['task_info']['name']}
命令: \${info['task_info']['exec_type']}
执行时间: \${info['exec_time']}
重试次数: \${info['retry_times']}
\`
    return {
        push: true,
        content: content
    }
}
`}
                    </pre>
                </Box>
            </Popover>
        </React.Fragment>
    );
}