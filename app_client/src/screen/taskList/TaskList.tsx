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
import wsClient from "../../common/Websocket";
import {subscribableType} from "../../common/Websocket";

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
    type: string;
    schedule: string;
    singleton: boolean;
    disabled: boolean;
    runningCount: number;
    lastRunTime: string;
    nextRunTime: string;
    runningProcess: TaskLog[] = [];

    constructor(id: number = 0, name: string = "", type: string = "", schedule: string = "",
                singleton: boolean = false, disabled: boolean = false, runningCount: number = 0, lastRunTime: string = "", nextRunTime: string = "", runningProcess: TaskLog[] = []) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.schedule = schedule;
        this.singleton = singleton;
        this.disabled = disabled;
        this.runningCount = runningCount;
        this.lastRunTime = lastRunTime;
        this.nextRunTime = nextRunTime;
        this.runningProcess = runningProcess;
    }
}

const logList = [
    new TaskLog(1, 1, "curl -L https://halo.sg.agreenmall.com", 11454, "2022-05-25 10:00:00"),
    new TaskLog(2, 1, "curl -L https://halo.sg.agreenmall.com", 4585, "2022-05-25 10:01:00"),
    new TaskLog(3, 1, "curl -L https://halo.sg.agreenmall.com", 45755, "2022-05-25 10:02:00"),
]

const taskList = [
    new TaskInfo(1, "a28i赔率采集", "HTTP", "1 0 0 0 *", true, false, 3, "2022-05-25 10:00:00", "2022-05-25 10:00:10", logList),
    new TaskInfo(2, "a28i比赛状态更新", "HTTP", "1 0 0 0 *", true, false, 2, "2022-05-25 10:00:00", "2022-05-25 10:00:05", logList),
    new TaskInfo(3, "比赛结果通知", "HTTP", "1 0 0 0 *", true, false, 6, "2022-05-25 10:00:00", "2022-05-25 10:00:55", logList),
];


export const TaskList = function () {
    const taskAddRef = useRef<TaskAddRefType>(null);
    const taskDeleteConfirmDialogRef = useRef<TaskDeleteConfirmDialogRefType>(null);
    const showCreateDialog = () => {
        taskAddRef.current?.handleClickOpen();
    }
    const showConfirmDeleteDialog = (taskInfo: TaskInfo) => {
        taskDeleteConfirmDialogRef.current?.handleClickOpen(taskInfo);
    }
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
    useEffect(()=>{
        wsClient.subscribe(subscribableType.TASK, taskInfo.id, (newTaskInfo) => {
            console.log(newTaskInfo);
        })
        return ()=>{
            wsClient.unsubscribe(subscribableType.TASK, taskInfo.id);
        }
    })
    return (
        <React.Fragment>

            <TableRow
                key={taskInfo.name}
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
                <TableCell>{taskInfo.name}</TableCell>
                <TableCell align="right">{taskInfo.type}</TableCell>
                <TableCell align="right">{taskInfo.schedule}</TableCell>
                <TableCell align="right">{taskInfo.singleton ?
                    <CheckCircleOutlineIcon/> : ""}</TableCell>
                <TableCell align="right">{taskInfo.disabled ?
                    <CheckCircleOutlineIcon/> : ""}</TableCell>
                <TableCell align="right">{taskInfo.runningCount}</TableCell>
                <TableCell align="right">{taskInfo.lastRunTime}</TableCell>
                <TableCell align="right">{taskInfo.nextRunTime}</TableCell>
                <TableCell align="right">
                    <ButtonGroup variant="outlined" aria-label="outlined button group" size="small">
                        <Button>Detail</Button>
                        <Button>Edit</Button>
                        <Button onClick={() => {
                            showConfirmDeleteDialog(taskInfo)
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
                                    {taskInfo.runningProcess.map((taskLog) => (
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