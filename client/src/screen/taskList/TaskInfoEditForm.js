import {forwardRef, useImperativeHandle, useState} from "react";
import * as React from "react";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import {FormControl, FormLabel, InputLabel, MenuItem, Radio, RadioGroup, Select, Switch} from "@mui/material";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import {ExecuteTypeEnum} from "../../enum/task";

import { oneDark } from '@codemirror/theme-one-dark';
import CodeMirror from '@uiw/react-codemirror';
import {javascript} from "@codemirror/lang-javascript";

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
    return (
        <React.Fragment>
            <Typography variant="h6" gutterBottom>
                Task Info
            </Typography>
            <Grid container spacing={3}>
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
                                {ExecuteTypeEnum.getLanguage(ExecuteTypeEnum.HTTP)}
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
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
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
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                    />
                </Grid>
                <Grid item xs={12}>
                    <FormControl>
                        <FormLabel id="demo-radio-buttons-group-label">Execute Strategy (when last task is running)</FormLabel>
                        <RadioGroup
                            aria-labelledby="demo-radio-buttons-group-label"
                            defaultValue={ExecStrategy}
                            name="radio-buttons-group"
                            onChange={handleExecStrategyChange}
                        >
                            <FormControlLabel value={0} control={<Radio />} label="Parallel" />
                            <FormControlLabel value={1} control={<Radio />} label="Skip" />
                            <FormControlLabel value={2} control={<Radio />} label="Delay" />
                        </RadioGroup>
                    </FormControl>
                </Grid>
                <Grid item xs={12}>
                    <FormControlLabel control={<Switch  checked={IsDisable} onChange={handleIsDisableChange} />} label="Disabled" />
                </Grid>
                <Grid item xs={12}>
                    <CodeMirror
                        value={assert}
                        height="300px"
                        theme={oneDark}
                        extensions={[javascript({ jsx: false, typescript: false })]}
                        onChange={(value, viewUpdate) => {
                            handleAssertChange(value)
                            // console.log('value:', value);
                        }}
                    />
                </Grid>
            </Grid>
        </React.Fragment>
    );
});