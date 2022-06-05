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
        command: "",
        schedule: "",
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
            const newTaskList = res.data.map(taskInfo => {
                return {
                    ...taskInfo,
                    //这个作为key 是为了修改之后返回来就可以渲染，否则从新拿到的数据不渲染 不生成随机字符串是为了只渲染修改的那一条就可以了
                    uniKey: taskInfo.update_time + "_" + taskInfo.id
                }
            })
            setTaskList(newTaskList);
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
                        startIcon={<RefreshIcon/>}
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
                                                <Skeleton variant="text"/>
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                                : taskList && taskList?.map((taskInfo, inx) => (
                                <TaskRow key={taskInfo.uniKey} taskInfo={taskInfo} index={inx}
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
    const {taskInfo, index, showConfirmDeleteDialog, showEditDialog} = props;
    const [selfTaskInfo, setSelfTaskInfo] = useState(taskInfo);
    const [open, setOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const handleMenuClose = () => {
        setMenuOpen(false);
    };
    useSubscribe(SubscribeType.TASK, taskInfo.id, (data) => {
        setSelfTaskInfo({
            ...selfTaskInfo,
            ...data
        })
    })
    const anchorRef = React.useRef(null);
    const navigate = useNavigate();
    const gotoTaskInfo = () => {
        navigate(`/admin/taskInfo/${selfTaskInfo.id}`)
    }
    return (
        <React.Fragment>
            <TableRow
                key={selfTaskInfo.id}
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
                <TableCell>{selfTaskInfo.name}</TableCell>
                <TableCell align="right">{selfTaskInfo.exec_type}</TableCell>
                <TableCell align="right">{selfTaskInfo.schedule}</TableCell>
                <TableCell align="right">{StrategyEnum.getLanguage(selfTaskInfo.exec_strategy)}</TableCell>
                <TableCell align="right">{selfTaskInfo.is_disable ?
                    <CheckCircleOutlineIcon/> : ""}</TableCell>
                <TableCell align="right">{selfTaskInfo.running_count}</TableCell>
                <TableCell align="right">{selfTaskInfo.last_run_time}</TableCell>
                <TableCell align="right">{selfTaskInfo.next_run_time}</TableCell>
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
                        {/*    showConfirmDeleteDialog(selfTaskInfo)*/}
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
                                            <MenuItem onClick={() => {
                                                showEditDialog(selfTaskInfo)
                                            }}>EDIT</MenuItem>
                                            <MenuItem onClick={() => {
                                                showConfirmDeleteDialog(selfTaskInfo)
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
            <TaskLogContainer open={open} taskId={selfTaskInfo.id}/>
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
    useSubscribe(SubscribeType.TASK_LOG_ADD, taskId, (data) => {
        setLogList([
            data,
            ...logList
        ])
    })
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
        }
        //eslint-disable-next-line
    },[])
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
    const [selfTaskLogInfo, setSelfTaskLogInfo] = useState(taskLogInfo)
    useSubscribe(SubscribeType.TASK_lOG, taskLogInfo.id, (data)=>{
        setSelfTaskLogInfo({
            ...selfTaskLogInfo,
            ...data
        })
    })
    useEffect(() => {
        if (!selfTaskLogInfo.status) {
            setTimeout(() => {
                handleDelete(selfTaskLogInfo.id)
            }, 3000)
        }
        //eslint-disable-next-line
    }, [selfTaskLogInfo])
    return (
        <React.Fragment>
            <TableRow key={selfTaskLogInfo.id}>
                <TableCell component="th" scope="row">
                    {selfTaskLogInfo.execution_time}
                </TableCell>
                <TableCell>{selfTaskLogInfo.command}</TableCell>
                <TableCell align="right">{selfTaskLogInfo.process_id}</TableCell>
                <TableCell align="right">{
                    selfTaskLogInfo.status ? selfTaskLogInfo.process_id > 0 ? <RunCircleIcon color="success"/> :
                        <HourglassEmptyIcon/> : <StopCircleIcon color="disabled"/>
                }</TableCell>
                <TableCell align="right">
                    <IconButton
                        size="small"
                        color="error"
                        disabled={!selfTaskLogInfo.status}
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