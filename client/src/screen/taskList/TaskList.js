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
import LoadingButton from '@mui/lab/LoadingButton';
import {
    Button,
    ButtonGroup, ClickAwayListener,
    Collapse,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle, Grow, MenuItem, MenuList, Popper, Skeleton
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
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import {useSubscribe, SubscribeType} from "../../common/socket/Websocket";
import httpRequest from "../../common/request/HttpRequest";
import {useNavigate} from "react-router-dom";
import {Refresh as RefreshIcon} from "@mui/icons-material";
import {TaskEdit} from "./TaskEdit";
import {StrategyEnum} from "../../enum/task";

export const TaskList = function () {
    const [taskList, setTaskList] = useState([]);
    const taskAddRef = useRef(null);
    const taskEditRef = useRef(null);
    const [taskEditInfo, setTaskEditInfo] = useState({
        id: 0,
        name: "",
        exec_type: "",
        command:"",
        schedule:"",
        retry_times: 0,
        retry_interval: 3000,
        exec_strategy: StrategyEnum.PARALLEL,
        is_disable: false
    });
    const taskDeleteConfirmDialogRef = useRef(null);
    const [loading, setLoading] = useState(true)
    const [refreshLoading, setRefreshLoading] = useState(false)
    const showCreateDialog = () => {
        taskAddRef.current?.handleClickOpen();
    }
    const showEditDialog = (taskInfo) => {
        setTaskEditInfo(taskInfo)
        taskEditRef.current.handleClickOpen();
    }
    const showConfirmDeleteDialog = (taskInfo) => {
        taskDeleteConfirmDialogRef.current?.handleClickOpen(taskInfo);
    }
    const firstRenderRef = useRef(true);
    const getTaskList = async () => {
        const res = await httpRequest.get("/getTaskList");
        if (res.code === 0) {
            setTaskList(res.data);
        }
    }
    const refreshTaskList = () => {
        setRefreshLoading(true);
        getTaskList().then(() => {
            setRefreshLoading(false);
        })
    }
    useEffect(() => {
        if (!firstRenderRef.current) {
            return;
        }
        firstRenderRef.current = false;
        getTaskList().then(() => {
            setLoading(false);
        });
    })
    const deleteTaskList = (taskId) => {
        const newTaskList = taskList.filter(taskInfo => taskInfo.id !== taskId);
        setTaskList(newTaskList)
    }
    return (
        <React.Fragment>
            <Container sx={{mt: 4, mb: 4}}>
                <TaskAdd ref={taskAddRef} refreshTaskList={refreshTaskList}/>
                <TaskEdit ref={taskEditRef} refreshTaskList={refreshTaskList} taskInfo={taskEditInfo}/>
                <Box sx={{mb: 2, display: "flex", justifyContent: "flex-end",}}>
                    <LoadingButton
                        loading={refreshLoading}
                        loadingPosition="start"
                        startIcon={<RefreshIcon />}
                        variant="contained"
                        sx={{mr: 2}}
                        onClick={refreshTaskList}
                    >
                        Refresh
                    </LoadingButton>
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
                                <TableCell align="right">Strategy</TableCell>
                                <TableCell align="right">Disabled</TableCell>
                                <TableCell align="right">Running Count</TableCell>
                                <TableCell align="right">Last Run Time</TableCell>
                                <TableCell align="right">Next Run Time</TableCell>
                                <TableCell align="right">Function</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ?
                                new Array(5).fill(0).map((_, rowIdx) => (
                                    <TableRow key={"row" + rowIdx}>
                                        {new Array(11).fill(0).map((_, cellIdx) => (
                                            <TableCell key={"row" + rowIdx + "cell" + cellIdx}>
                                                <Skeleton variant="text" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                                : taskList && taskList?.map((taskInfo, inx) => (
                                <TaskRow key={'taskItem' + taskInfo.id} taskInfo={taskInfo} index={inx}
                                         showConfirmDeleteDialog={showConfirmDeleteDialog}
                                         showEditDialog={showEditDialog}/>
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
    const {taskInfo, index, showConfirmDeleteDialog,showEditDialog} = props;
    const [open, setOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const handleMenuClose = () => {
        setMenuOpen(false);
    };
    const [taskUpdateInfo] = useSubscribe(SubscribeType.TASK, taskInfo.id, taskInfo)
    const anchorRef = React.useRef(null);
    const navigate = useNavigate();
    const gotoTaskInfo = () => {
        navigate(`/admin/taskInfo/${taskInfo.id}`)
    }
    return (
        <React.Fragment>
            <TableRow
                key={taskInfo.id}
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
                <TableCell align="right">{taskUpdateInfo.exec_type}</TableCell>
                <TableCell align="right">{taskUpdateInfo.schedule}</TableCell>
                <TableCell align="right">{StrategyEnum.getLanguage(taskUpdateInfo.exec_strategy)}</TableCell>
                <TableCell align="right">{taskUpdateInfo.is_disable ?
                    <CheckCircleOutlineIcon/> : ""}</TableCell>
                <TableCell align="right">{taskUpdateInfo.running_count}</TableCell>
                <TableCell align="right">{taskUpdateInfo.last_run_time}</TableCell>
                <TableCell align="right">{taskUpdateInfo.next_run_time}</TableCell>
                <TableCell align="right">
                    <ButtonGroup variant="contained" size="small" ref={anchorRef}>
                        <Button onClick={gotoTaskInfo}>Detail</Button>
                        <Button onClick={() => {
                            setMenuOpen(true)
                        }}>
                            <ArrowDropDownIcon/>
                        </Button>
                        {/*<Button>Edit</Button>*/}
                        {/*<Button onClick={() => {*/}
                        {/*    showConfirmDeleteDialog(taskUpdateInfo)*/}
                        {/*}}>Delete</Button>*/}
                        {/*<Button>Start</Button>*/}
                        {/*<Button>Stop</Button>*/}
                        {/*<Button>Stop And Kill</Button>*/}
                    </ButtonGroup>
                    <Popper
                        open={menuOpen}
                        anchorEl={anchorRef.current}
                        transition
                        disablePortal
                        sx={{zIndex: 2}}
                    >
                        {({TransitionProps, placement}) => (
                            <Grow
                                {...TransitionProps}
                                style={{
                                    transformOrigin:
                                        placement === 'bottom' ? 'center top' : 'center bottom',
                                }}
                            >
                                <Paper>
                                    <ClickAwayListener onClickAway={handleMenuClose}>
                                        <MenuList id="split-button-menu" autoFocusItem>
                                            <MenuItem onClick={()=>{
                                                showEditDialog(taskUpdateInfo)
                                            }}>EDIT</MenuItem>
                                            <MenuItem onClick={() => {
                                                showConfirmDeleteDialog(taskUpdateInfo)
                                            }}>DELETE</MenuItem>
                                            <MenuItem>START</MenuItem>
                                            <MenuItem>STOP</MenuItem>
                                            <MenuItem>KILL STOP</MenuItem>
                                        </MenuList>
                                    </ClickAwayListener>
                                </Paper>
                            </Grow>
                        )}
                    </Popper>
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
                                    <TaskLogRow key={"taskLog" + taskLog.id} taskLogInfo={taskLog}
                                                handleDelete={deleteEndLog}/>
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