import {forwardRef, useEffect, useImperativeHandle, useState} from "react";
import * as React from "react";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import {Chip, FormControl, FormLabel, InputLabel, MenuItem, Radio, RadioGroup, Select, Switch} from "@mui/material";
import FormControlLabel from "@mui/material/FormControlLabel";
import {ExecuteTypeEnum, PriorityEnum} from "../../enum/task";
import {AssertField} from "./fields/AssertField";
import {ResultHandlerField} from "./fields/ResultHandlerField";
import {ScheduleField} from "./fields/ScheduleField";
import Box from "@mui/material/Box";
import httpRequest from "../../common/request/HttpRequest";

export const TaskInfoEditForm = forwardRef((props, ref) => {
    const {taskInfo} = props
    useImperativeHandle(ref, () => ({
        getFormValues: getFormValues,
    }));
    const getFormValues = () => {
        return {
            name: taskName,
            description,
            exec_type: executeType,
            command,
            schedule,
            retry_times: parseInt(retryTimes),
            retry_interval: parseInt(retryInterval),
            exec_strategy: parseInt(ExecStrategy),
            is_disable: IsDisable,
            priority: parseInt(priority),
            tags: tags.join(","),
            assert,
            result_handler: resultHandler,
            node_id: parseInt(nodeId),
        }
    }
    const [taskName, setTaskName] = useState(taskInfo.name)
    const handleTaskNameChange = (event) => setTaskName(event.target.value)
    const [description, setDescription] = useState(taskInfo.description || "")
    const handleDescriptionChange = (event) => setDescription(event.target.value)
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
    const [priority, setPriority] = useState(taskInfo.priority !== undefined ? taskInfo.priority : PriorityEnum.MEDIUM)
    const handlePriorityChange = (event) => setPriority(event.target.value)
    const [tags, setTags] = useState(taskInfo.tags ? taskInfo.tags.split(",").filter(t => t.trim() !== "") : [])
    const [tagInput, setTagInput] = useState("")
    const handleTagInputChange = (event) => setTagInput(event.target.value)
    const handleTagInputKeyDown = (event) => {
        if (event.key === "Enter" && tagInput.trim() !== "") {
            event.preventDefault();
            if (!tags.includes(tagInput.trim())) {
                setTags([...tags, tagInput.trim()]);
            }
            setTagInput("");
        }
    }
    const handleDeleteTag = (tagToDelete) => {
        setTags(tags.filter(tag => tag !== tagToDelete));
    }
    const [assert, setAssert] = useState(taskInfo.assert)
    const handleAssertChange = (code) => setAssert(code)
    const [resultHandler, setResultHandler] = useState(taskInfo.result_handler)
    const handleResultHandlerChange = (code) => setResultHandler(code)
    const [nodeId, setNodeId] = useState(taskInfo.node_id || 0)
    const handleNodeIdChange = (event) => setNodeId(event.target.value)
    const [nodeSelectList, setNodeSelectList] = useState([])
    useEffect(() => {
        httpRequest.get("/node/select").then(res => {
            if (res.code === 0 && res.data) {
                setNodeSelectList(res.data)
                // 如果当前没有选中节点，默认选主节点
                if (!taskInfo.node_id && res.data.length > 0) {
                    const masterNode = res.data.find(n => n.is_master)
                    if (masterNode) setNodeId(masterNode.id)
                }
            }
        })
    }, [])
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
                    <TextField
                        id="description"
                        name="description"
                        label="Description"
                        value={description}
                        onChange={handleDescriptionChange}
                        fullWidth
                        multiline
                        rows={2}
                        variant="standard"
                        placeholder="Describe what this task does..."
                    />
                </Grid>
                <Grid item xs={12} md={6}>
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
                <Grid item xs={12} md={6}>
                    <FormControl variant="standard" sx={{minWidth: 120}}>
                        <InputLabel id="priority-label">Priority</InputLabel>
                        <Select
                            labelId="priority-label"
                            id="priority"
                            value={priority}
                            onChange={handlePriorityChange}
                            label="Priority"
                        >
                            <MenuItem value={PriorityEnum.LOW}>{PriorityEnum.getLabel(PriorityEnum.LOW)}</MenuItem>
                            <MenuItem value={PriorityEnum.MEDIUM}>{PriorityEnum.getLabel(PriorityEnum.MEDIUM)}</MenuItem>
                            <MenuItem value={PriorityEnum.HIGH}>{PriorityEnum.getLabel(PriorityEnum.HIGH)}</MenuItem>
                            <MenuItem value={PriorityEnum.CRITICAL}>{PriorityEnum.getLabel(PriorityEnum.CRITICAL)}</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                    <FormControl variant="standard" sx={{minWidth: 200}}>
                        <InputLabel id="node-select-label">执行节点</InputLabel>
                        <Select
                            labelId="node-select-label"
                            id="node-select"
                            value={nodeId}
                            onChange={handleNodeIdChange}
                            label="执行节点"
                        >
                            {nodeSelectList.map(node => (
                                <MenuItem key={node.id} value={node.id}>
                                    {node.name}{node.region ? ` (${node.region})` : ""}
                                    {node.is_master ? " ★" : ""}
                                </MenuItem>
                            ))}
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
                <Grid item xs={12}>
                    <TextField
                        id="tags"
                        name="tags"
                        label="Tags (press Enter to add)"
                        value={tagInput}
                        onChange={handleTagInputChange}
                        onKeyDown={handleTagInputKeyDown}
                        fullWidth
                        variant="standard"
                        placeholder="Type a tag and press Enter..."
                    />
                    <Box sx={{display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1}}>
                        {tags.map((tag) => (
                            <Chip key={tag} label={tag} size="small" onDelete={() => handleDeleteTag(tag)}/>
                        ))}
                    </Box>
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
                        id="retryInterval"
                        name="retryInterval"
                        label="Retry Interval (seconds)"
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

