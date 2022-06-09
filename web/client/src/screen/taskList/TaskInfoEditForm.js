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
// import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import {AssertField} from "./fields/AssertField";
import {ResultHandlerField} from "./fields/ResultHandlerField";
import {ScheduleField} from "./fields/ScheduleField";

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
                    <ScheduleField schedule={schedule} handleScheduleChange={handleScheduleChange}/>
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
                    <AssertField assert={assert} handleAssertChange={handleAssertChange}/>
                </Grid>
                <Grid item xs={12}>
                    <ResultHandlerField resultHandler={resultHandler} handleResultHandlerChange={handleResultHandlerChange}/>
                </Grid>
            </Grid>
        </React.Fragment>
    );
});

