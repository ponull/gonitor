import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Container from "@mui/material/Container";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import {
    Button,
    ButtonGroup,
    Collapse,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle
} from "@mui/material";
import Box from "@mui/material/Box";
import AddIcon from '@mui/icons-material/Add';
import {TaskAdd, TaskAddRefType} from "./TaskAdd";
import {forwardRef, Ref, useEffect, useImperativeHandle, useRef, useState} from "react";
import Dialog from "@mui/material/Dialog";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import {useSubscribe,SubscribeType} from "../../common/socket/Websocket";
import axios from "axios";

class TaskLog {
    id: number;
    task_id: number;
    command: string;
    process_id: number;
    execution_time: string;

    constructor(id: number = 0, task_id: number = 0, command: string = "", process_id: number = 0, execution_time: string = "") {
        this.id = id;
        this.task_id = task_id;
        this.command = command;
        this.process_id = process_id;
        this.execution_time = execution_time;
    }
}

class TaskInfo {
    id: number;
    name: string;
    execType: string;
    schedule: string;
    isSingleton: boolean;
    isDisable: boolean;
    runningCount: number;
    lastRunTime: string;
    nextRunTime: string;

    constructor(id: number = 0, name: string = "", type: string = "", schedule: string = "",
                singleton: boolean = false, disabled: boolean = false, runningCount: number = 0, lastRunTime: string = "", nextRunTime: string = "") {
        this.id = id;
        this.name = name;
        this.execType = type;
        this.schedule = schedule;
        this.isSingleton = singleton;
        this.isDisable = disabled;
        this.runningCount = runningCount;
        this.lastRunTime = lastRunTime;
        this.nextRunTime = nextRunTime;
    }
}

// const logList = [
//     new TaskLog(1, 1, "curl -L https://halo.sg.agreenmall.com", 11454, "2022-05-25 10:00:00"),
//     new TaskLog(2, 1, "curl -L https://halo.sg.agreenmall.com", 4585, "2022-05-25 10:01:00"),
//     new TaskLog(3, 1, "curl -L https://halo.sg.agreenmall.com", 45755, "2022-05-25 10:02:00"),
// ];

export const TaskList = function () {
    const [taskList, setTaskList] = useState<TaskInfo[]>([]);
    const taskAddRef = useRef<TaskAddRefType>(null);
    const taskDeleteConfirmDialogRef = useRef<TaskDeleteConfirmDialogRefType>(null);
    const showCreateDialog = () => {
        taskAddRef.current?.handleClickOpen();
    }
    const showConfirmDeleteDialog = (taskInfo: TaskInfo) => {
        taskDeleteConfirmDialogRef.current?.handleClickOpen(taskInfo);
    }
    const firstRenderRef = useRef(true);
    useEffect(()=>{
        if(!firstRenderRef.current){
            return;
        }
        firstRenderRef.current = false;
        axios.get(`http://127.0.0.1:8899/getTaskList`).then(res => {
            const data = res.data as TaskInfo[];
            setTaskList(data)
        })
    })
    return (
        <React.Fragment>
            <Container sx={{mt: 4, mb: 4}}>
                <TaskAdd ref={taskAddRef}/>
                <Box sx={{mb: 2, display: "flex", justifyContent: "flex-end",}}>
                    <Button variant="contained" startIcon={<AddIcon/>} onClick={showCreateDialog}>
                        Add
                    </Button>
                </Box>
                <TableContainer component={Paper}>
                    <Table sx={{minWidth: 650}} aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                <TableCell/>
                                <TableCell>No.</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell align="right">Type</TableCell>
                                <TableCell align="right">Schedule</TableCell>
                                <TableCell align="right">Singleton</TableCell>
                                <TableCell align="right">Disabled</TableCell>
                                <TableCell align="right">Running Count</TableCell>
                                <TableCell align="right">Last Run Time</TableCell>
                                <TableCell align="right">Next Run Time</TableCell>
                                <TableCell align="right">Function</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {taskList.map((taskInfo, inx) => (
                                <TaskRow key={taskInfo.id} taskInfo={taskInfo} index={inx}
                                         showConfirmDeleteDialog={showConfirmDeleteDialog}/>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <DeleteConfirmDialog ref={taskDeleteConfirmDialogRef}/>
            </Container>
        </React.Fragment>
    )
}

const TaskRow = (props: { taskInfo: TaskInfo, index: number, showConfirmDeleteDialog: Function }) => {
    const {taskInfo, index, showConfirmDeleteDialog} = props;
    const [open, setOpen] = useState(false);
    const [taskUpdateInfo] = useSubscribe<TaskInfo>(SubscribeType.TASK, taskInfo.id, taskInfo)
    const [logList, setLogList] = useState<TaskLog[]>([]);
    const firstRenderRef = useRef(true);
    useEffect(()=>{
        if(!firstRenderRef.current){
            return;
        }
        firstRenderRef.current = false;
        axios.get(`http://127.0.0.1:8899/getTaskLogList`).then(res => {
            const data = res.data as TaskLog[];
            setLogList(data)
        })
    })
    return (
        <React.Fragment>

            <TableRow
                key={taskUpdateInfo.name}
                sx={{'&:last-child td, &:last-child th': {border: 0}}}
            >
                <TableCell>
                    <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={() => setOpen(!open)}
                    >
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell component="th" scope="row">
                    {index + 1}
                </TableCell>
                <TableCell>{taskUpdateInfo.name}</TableCell>
                <TableCell align="right">{taskUpdateInfo.execType}</TableCell>
                <TableCell align="right">{taskUpdateInfo.schedule}</TableCell>
                <TableCell align="right">{taskUpdateInfo.isSingleton ?
                    <CheckCircleOutlineIcon/> : ""}</TableCell>
                <TableCell align="right">{taskUpdateInfo.isDisable ?
                    <CheckCircleOutlineIcon/> : ""}</TableCell>
                <TableCell align="right">{taskUpdateInfo.runningCount}</TableCell>
                <TableCell align="right">{taskUpdateInfo.lastRunTime}</TableCell>
                <TableCell align="right">{taskUpdateInfo.nextRunTime}</TableCell>
                <TableCell align="right">
                    <ButtonGroup variant="outlined" aria-label="outlined button group" size="small">
                        <Button>Detail</Button>
                        <Button>Edit</Button>
                        <Button onClick={() => {
                            showConfirmDeleteDialog(taskUpdateInfo)
                        }}>Delete</Button>
                    </ButtonGroup>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={11}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            <Typography variant="h6" gutterBottom component="div">
                                Running Instances
                            </Typography>
                            <Table size="small" aria-label="purchases">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Time</TableCell>
                                        <TableCell>Command</TableCell>
                                        <TableCell align="right">Process Id</TableCell>
                                        <TableCell align="right">Function</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {logList.map((taskLog) => (
                                        <TableRow key={taskLog.id}>
                                            <TableCell component="th" scope="row">
                                                {taskLog.execution_time}
                                            </TableCell>
                                            <TableCell>{taskLog.command}</TableCell>
                                            <TableCell align="right">{taskLog.process_id}</TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                >
                                                    <StopCircleIcon/>
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment>
    )
}


type TaskDeleteConfirmDialogRefType = {
    handleClickOpen: Function,
}

const DeleteConfirmDialog = forwardRef((props: any, ref: Ref<TaskDeleteConfirmDialogRefType>) => {
    useImperativeHandle(ref, () => ({
        handleClickOpen,
    }));
    const [open, setOpen] = useState(false);
    const [taskInfo, setTaskInfo] = useState(new TaskInfo());
    const handleClickOpen = (taskInfo: TaskInfo) => {
        setTaskInfo(taskInfo);
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
    };
    return (
        <React.Fragment>
            <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
                <DialogTitle id="form-dialog-title">Delete Task</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure to delete this task witch name {taskInfo.name} - {taskInfo.id}?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleClose} color="primary">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    )
})