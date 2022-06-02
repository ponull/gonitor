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
import RunCircleIcon from '@mui/icons-material/RunCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import {
    Button,
    ButtonGroup,
    Collapse,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle, Skeleton
} from "@mui/material";
import Box from "@mui/material/Box";
import AddIcon from '@mui/icons-material/Add';
import {TaskAdd} from "./TaskAdd";
import {forwardRef, useEffect, useImperativeHandle, useRef, useState} from "react";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import {useSubscribe, SubscribeType} from "../../common/socket/Websocket";
import httpRequest from "../../common/request/HttpRequest";
import {useNavigate} from "react-router-dom";


export const TaskList = function () {
    const [taskList, setTaskList] = useState([]);
    const taskAddRef = useRef(null);
    const taskDeleteConfirmDialogRef = useRef(null);
    // const {enqueueSnackbar, closeSnackbar} = useSnackbar();
    // enqueueSnackbar("666666", {variant: "error"});
    const [loading, setLoading] = useState(true)
    const showCreateDialog = () => {
        taskAddRef.current?.handleClickOpen();
    }
    const showConfirmDeleteDialog = (taskInfo) => {
        taskDeleteConfirmDialogRef.current?.handleClickOpen(taskInfo);
    }
    const firstRenderRef = useRef(true);
    useEffect(() => {
        if (!firstRenderRef.current) {
            return;
        }
        firstRenderRef.current = false;

        httpRequest.get(`/getTaskList`)
            .then(res => {
                const data = res.data;
                setTaskList(data)
            })
            .catch(err => {
            })
            .finally(()=>{
                setLoading(false)
            })
    })
    const deleteTaskList = (taskId) => {
        const newTaskList = taskList.filter(taskInfo => taskInfo.id !== taskId);
        setTaskList(newTaskList)
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
                            {/*{taskList && taskList?.map((taskInfo, inx) => (*/}
                            {/*    <TaskRow key={taskInfo.id} taskInfo={taskInfo} index={inx}*/}
                            {/*             showConfirmDeleteDialog={showConfirmDeleteDialog}/>*/}
                            {/*))}*/}
                            {loading ?
                                new Array(5).fill(0).map((_, rowIdx) => (
                                    <TableRow key={"row" + rowIdx}>
                                        {new Array(11).fill(0).map((_, cellIdx) => (
                                            <TableCell>
                                                <Skeleton key={"row" + rowIdx + "cell" + cellIdx}>
                                                    <TableCell component="th" scope="row"/>
                                                </Skeleton>
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                                : taskList && taskList?.map((taskInfo, inx) => (
                                    <TaskRow key={'taskItem' + taskInfo.id} taskInfo={taskInfo} index={inx}
                                             showConfirmDeleteDialog={showConfirmDeleteDialog}/>
                                ))
                            }
                        </TableBody>
                    </Table>
                </TableContainer>
                <DeleteConfirmDialog ref={taskDeleteConfirmDialogRef} deleteTaskById={deleteTaskList}/>
            </Container>
        </React.Fragment>
    )
}

const TaskRow = (props) => {
    const {taskInfo, index, showConfirmDeleteDialog} = props;
    const [open, setOpen] = useState(false);
    const [taskUpdateInfo] = useSubscribe(SubscribeType.TASK, taskInfo.id, taskInfo)
    const navigate = useNavigate();
    const gotoTaskInfo = () => {
        console.log(111)
        navigate(`/admin/taskInfo/${taskInfo.id}`)
    }
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
                        {open ? <KeyboardArrowUpIcon/> : <KeyboardArrowDownIcon/>}
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
                        <Button onClick={gotoTaskInfo}>Detail</Button>
                        <Button>Edit</Button>
                        <Button onClick={() => {
                            showConfirmDeleteDialog(taskUpdateInfo)
                        }}>Delete</Button>
                    </ButtonGroup>
                </TableCell>
            </TableRow>
            <TaskLogContainer open={open} taskId={taskUpdateInfo.id}/>
        </React.Fragment>
    )
}

const TaskLogContainer = (props: { open: boolean; taskId: number; }) => {
    const {open, taskId} = props

    const [logList, setLogList] = useState([]);
    const deleteEndLog = (logId) => {
        const newLogList = logList.filter(log => log.id !== logId);
        setLogList(newLogList);
    }
    const [taskLogNew] = useSubscribe(SubscribeType.TASK_LOG_ADD, taskId, {})
    const firstRenderRef = useRef(true)
    useEffect(() => {
        if (firstRenderRef.current) {
            firstRenderRef.current = false

            httpRequest.get(`getTaskLogList?task_id=${taskId}`)
                .then(res => {
                    const data = res.data;
                    setLogList(data)
                })
            // axios.get(`http://127.0.0.1:8899/getTaskLogList?task_id=${taskId}`).then(res => {
            //     const data = res.data as TaskLog[];
            //     setLogList(data)
            // })
        } else {
            if (taskLogNew.id !== 0) {
                console.log(taskLogNew)
                setLogList([taskLogNew, ...logList])
            }
        }
        //eslint-disable-next-line
    }, [taskLogNew])
    return (
        <TableRow>
            <TableCell style={{paddingBottom: 0, paddingTop: 0}} colSpan={11}>
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <Box sx={{margin: 1}}>
                        <Table size="small" aria-label="purchases">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Time</TableCell>
                                    <TableCell>Command</TableCell>
                                    <TableCell align="right">Process Id</TableCell>
                                    <TableCell align="right">Status</TableCell>
                                    <TableCell align="right">Function</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {logList && logList.map((taskLog) => (
                                    <TaskLogRow key={"taskLog" + taskLog.id} taskLogInfo={taskLog} handleDelete={deleteEndLog}/>
                                ))}
                            </TableBody>
                        </Table>
                    </Box>
                </Collapse>
            </TableCell>
        </TableRow>
    )
}
const TaskLogRow = (props) => {
    const {taskLogInfo, handleDelete} = props

    const [taskLogUpdateInfo] = useSubscribe(SubscribeType.TASK_lOG, taskLogInfo.id, taskLogInfo)
    useEffect(() => {
        if (!taskLogUpdateInfo.status) {
            setTimeout(() => {
                handleDelete(taskLogUpdateInfo.id)
            }, 3000)
        }
        //eslint-disable-next-line
    }, [taskLogUpdateInfo])
    return (
        <React.Fragment>
            <TableRow key={taskLogUpdateInfo.id}>
                <TableCell component="th" scope="row">
                    {taskLogUpdateInfo.execution_time}
                </TableCell>
                <TableCell>{taskLogUpdateInfo.command}</TableCell>
                <TableCell align="right">{taskLogUpdateInfo.process_id}</TableCell>
                <TableCell align="right">{
                    taskLogUpdateInfo.status ? taskLogUpdateInfo.process_id > 0 ? <RunCircleIcon color="success"/> :
                        <HourglassEmptyIcon/> : <StopCircleIcon color="disabled"/>
                }</TableCell>
                <TableCell align="right">
                    <IconButton
                        size="small"
                        color="error"
                        disabled={!taskLogUpdateInfo.status}
                    >
                        <StopCircleIcon/>
                    </IconButton>
                </TableCell>
            </TableRow>
        </React.Fragment>
    )
}


const DeleteConfirmDialog = forwardRef((props, ref) => {
    const {deleteTaskById} = props
    useImperativeHandle(ref, () => ({
        handleClickOpen,
    }));
    const [open, setOpen] = useState(false);
    const [taskInfo, setTaskInfo] = useState({});
    const handleClickOpen = (taskInfo) => {
        setTaskInfo(taskInfo);
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
    };
    const deleteTask = () => {
        httpRequest.post("deleteTask", {
            task_id: taskInfo.id
        })
            .then(res => {
                const data = res.data
                if (data.code === 0) {
                    deleteTaskById(taskInfo.id)
                }
            })
            .catch(err => {
                console.log(err)
            })
            .finally(() => {
                handleClose()
            })
    }
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
                    <Button onClick={deleteTask} color="primary">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    )
})