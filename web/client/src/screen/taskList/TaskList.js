import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Container from "@mui/material/Container";
import LoadingButton from '@mui/lab/LoadingButton';
import {
    Button,
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
import httpRequest from "../../common/request/HttpRequest";
import {Refresh as RefreshIcon} from "@mui/icons-material";
import {TaskEdit} from "./TaskEdit";
import {StrategyEnum} from "../../enum/task";
import {TaskRow} from "./TaskRow";

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
        is_disable: false,
        assert: "",
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
        const res = await httpRequest.get("/task/list");
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
    },[])
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
                                        {new Array(10).fill(0).map((_, cellIdx) => (
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