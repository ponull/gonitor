import * as React from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Slide from '@mui/material/Slide';
import {TransitionProps} from '@mui/material/transitions';
import {forwardRef, useImperativeHandle, useRef, useState} from "react";
import Container from "@mui/material/Container";
import {FormControl, InputLabel, MenuItem, Select} from "@mui/material";
import httpRequest from "../../common/request/HttpRequest";

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export const TaskAdd = forwardRef((props, ref) => {
    useImperativeHandle(ref, () => ({
        handleClickOpen,
    }));
    const [open, setOpen] = React.useState(false);
    const formRef = useRef(null);
    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleSubmit = () => {
        const formValue = formRef.current?.getFormValues()
        httpRequest.post("addTask", formValue)
            .then(res => {
                console.log(res)
            })
            .catch(err => {
                console.log(err)
            })
    }

    return (
        <Dialog
            fullScreen
            open={open}
            onClose={handleClose}
            TransitionComponent={Transition}
        >
            <AppBar sx={{position: 'relative'}}>
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        onClick={handleClose}
                        aria-label="close"
                    >
                        <CloseIcon/>
                    </IconButton>
                    <Typography sx={{ml: 2, flex: 1}} variant="h6" component="div">
                        Add Task
                    </Typography>
                    <Button autoFocus color="inherit" onClick={handleSubmit}>
                        save
                    </Button>
                </Toolbar>
            </AppBar>
            <Container maxWidth={"md"} sx={{mt:4}}>
                <TaskAddForm ref={formRef}/>
            </Container>
        </Dialog>
    );
});

const executeTypeEnum = {
    HTTP : 'Http',
    CMD : 'Cmd',
    FILE : 'File',
}

export const TaskAddForm = forwardRef((props, ref) => {
    useImperativeHandle(ref, () => ({
        getFormValues: getFormValues,
    }));
    const getFormValues = () => {
        return {
            name: taskName,
            exec_type: executeType,
            command,
            schedule,
            retry_times: retryTimes,
            retry_interval: retryInterval,
            is_singleton: IsSingleton,
            is_disable: IsDisable
        }
    }
    const [taskName, setTaskName] = useState("")
    const handleTaskNameChange = (event) => setTaskName(event.target.value)
    const [executeType, setExecuteType] = useState(executeTypeEnum.HTTP)
    const handleExecuteTypeChange = (event) => {
        const executeType = event.target.value;
        setExecuteType(executeType);
        switch (executeType) {
            case executeTypeEnum.HTTP:
                setCommandName('Http Url (only support GET method)')
                break;
            case executeTypeEnum.CMD:
                setCommandName('Bash Command')
                break;
            case executeTypeEnum.FILE:
                setCommandName('File Path (Fullpath)')
                break;
            default:
                setCommandName('Http Url (only support GET method)')
        }
    };
    const [commandName, setCommandName] = useState('Http Url (only support GET method)');
    const [command, setCommand] = useState("");
    const handleCommandChange = (event) => setCommand(event.target.value)
    const [schedule, setSchedule] = useState("")
    const handleScheduleChange = (event) => setSchedule(event.target.value)
    const [retryTimes, setRetryTimes] = useState(0)
    const handleRetryTimesChange = (event) => setRetryTimes(event.target.value)
    const [retryInterval, setRetryInterval] = useState(3000)
    const handleRetryIntervalChange = (event) => setRetryInterval(event.target.value)
    const [IsSingleton, setIsSingleton] = useState(false)
    const handleIsSingletonChange = (event) => setIsSingleton(event.target.checked)
    const [IsDisable, setIsDisable] = useState(false)
    const handleIsDisableChange = (event) => setIsDisable(event.target.checked)
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
                            <MenuItem value={executeTypeEnum.HTTP}>Http</MenuItem>
                            <MenuItem value={executeTypeEnum.CMD}>Cmd</MenuItem>
                            <MenuItem value={executeTypeEnum.FILE}>File</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        required
                        id="command"
                        name="command"
                        label={commandName}
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
                        label="Retry Interval"
                        value={retryInterval}
                        onChange={handleRetryIntervalChange}
                        fullWidth
                        variant="standard"
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                    />
                </Grid>
                <Grid item xs={12}>
                    <FormControlLabel
                        control={<Checkbox name="saveAddress" checked={IsSingleton} onChange={handleIsSingletonChange}/>}
                        label="Singleton"
                    />
                </Grid>
                <Grid item xs={12}>
                    <FormControlLabel
                        control={<Checkbox name="saveAddress" checked={IsDisable} onChange={handleIsDisableChange}/>}
                        label="Disable"
                    />
                </Grid>
            </Grid>
        </React.Fragment>
    );
});