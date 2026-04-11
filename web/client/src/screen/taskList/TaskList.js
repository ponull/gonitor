import * as React from 'react';
import LoadingButton from '@mui/lab/LoadingButton';
import {
    Alert,
    Button,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
} from "@mui/material";
import Box from "@mui/material/Box";
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import {TaskAdd} from "./TaskAdd";
import {forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState} from "react";
import Dialog from "@mui/material/Dialog";
import httpRequest from "../../common/request/HttpRequest";
import {Refresh as RefreshIcon} from "@mui/icons-material";
import {TaskEdit} from "./TaskEdit";
import {PriorityEnum, StrategyEnum} from "../../enum/task";
import {TaskListTableStyle} from "./TaskListTableStyle";
import {TaskListCardStyle} from "./TaskListCardStyle";
import {useScreenSize} from "../../common/utils/hook";
import {useSnackbar} from "notistack";

export const TaskList = function () {
    const [taskList, setTaskList] = useState([]);
    const taskAddRef = useRef(null);
    const taskEditRef = useRef(null);
    const [taskEditInfo, setTaskEditInfo] = useState({
        id: 0,
        name: "",
        description: "",
        exec_type: "",
        command: "",
        schedule: "",
        retry_times: 0,
        retry_interval: 3000,
        exec_strategy: StrategyEnum.PARALLEL,
        is_disable: false,
        priority: PriorityEnum.MEDIUM,
        tags: "",
        assert: "",
        result_handler: "",
    });
    const taskDeleteConfirmDialogRef = useRef(null);
    const [loading, setLoading] = useState(true)
    const [refreshLoading, setRefreshLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [searchKeyword, setSearchKeyword] = useState("")
    const [filterPriority, setFilterPriority] = useState("")
    const [filterStatus, setFilterStatus] = useState("")
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
    const getTaskList = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (searchKeyword) params.append("keyword", searchKeyword);
            if (filterPriority !== "") params.append("priority", filterPriority);
            if (filterStatus) params.append("status", filterStatus);
            const queryString = params.toString();
            const url = queryString ? `/task/list?${queryString}` : "/task/list";
            const res = await httpRequest.get(url);
            if (res.code !== 0) {
                setTaskList([]);
                setErrorMessage(res.message || "Failed to load tasks");
                return;
            }
            const newTaskList = res.data ? res.data.map(taskInfo => {
                return {
                    ...taskInfo,
                    //这个作为key 是为了修改之后返回来就可以渲染，否则从新拿到的数据不渲染 不生成随机字符串是为了只渲染修改的那一条就可以了
                    uniKey: taskInfo.update_time + "_" + taskInfo.id
                }
            }) : [];
            setErrorMessage("");
            setTaskList(newTaskList);
        } catch (err) {
            setTaskList([]);
            setErrorMessage(err.message || "Failed to load tasks");
        }
    }, [filterPriority, filterStatus, searchKeyword])
    const refreshTaskList = async () => {
        setRefreshLoading(true);
        await getTaskList();
        setRefreshLoading(false);
    }
    useEffect(() => {
        if (!firstRenderRef.current) {
            return;
        }
        firstRenderRef.current = false;
        getTaskList().then(() => {
            setLoading(false);
        });
    }, [getTaskList])
    const handleSearch = async () => {
        setLoading(true);
        await getTaskList();
        setLoading(false);
    }
    const handleSearchKeyDown = (event) => {
        if (event.key === "Enter") {
            handleSearch();
        }
    }
    const deleteTaskList = (taskId) => {
        const newTaskList = taskList.filter(taskInfo => taskInfo.id !== taskId);
        setTaskList(newTaskList)
    }
    const {isDesktop} = useScreenSize();
    const hasFilters = Boolean(searchKeyword || filterPriority !== "" || filterStatus);
    let taskListContent;
    if (errorMessage) {
        taskListContent = (
            <Alert
                severity="error"
                action={<Button color="inherit" size="small" onClick={refreshTaskList}>Retry</Button>}
            >
                {errorMessage}
            </Alert>
        );
    } else if (!loading && taskList.length === 0) {
        taskListContent = (
            <Alert severity="info">
                {hasFilters ? "No tasks match the current filters." : "No tasks yet. Create your first task to get started."}
            </Alert>
        );
    } else if (isDesktop) {
        taskListContent = (
            <TaskListTableStyle
                loading={loading}
                taskList={taskList}
                showConfirmDeleteDialog={showConfirmDeleteDialog}
                showEditDialog={showEditDialog}
            />
        );
    } else {
        taskListContent = (
            <TaskListCardStyle
                loading={loading}
                taskList={taskList}
                showConfirmDeleteDialog={showConfirmDeleteDialog}
                showEditDialog={showEditDialog}
            />
        );
    }
    return (
        <React.Fragment>
            <Box sx={{m: 2}}>
                <TaskAdd ref={taskAddRef} refreshTaskList={refreshTaskList}/>
                <TaskEdit ref={taskEditRef} refreshTaskList={refreshTaskList} taskInfo={taskEditInfo}/>
                <Box sx={{mb: 2, display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center"}}>
                    <TextField
                        size="small"
                        placeholder="Search tasks..."
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        sx={{minWidth: 200, flexGrow: 1, maxWidth: 400}}
                    />
                    <FormControl size="small" sx={{minWidth: 120}}>
                        <InputLabel id="filter-priority-label">Priority</InputLabel>
                        <Select
                            labelId="filter-priority-label"
                            value={filterPriority}
                            label="Priority"
                            onChange={(e) => setFilterPriority(e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value={PriorityEnum.LOW}>{PriorityEnum.getLabel(PriorityEnum.LOW)}</MenuItem>
                            <MenuItem value={PriorityEnum.MEDIUM}>{PriorityEnum.getLabel(PriorityEnum.MEDIUM)}</MenuItem>
                            <MenuItem value={PriorityEnum.HIGH}>{PriorityEnum.getLabel(PriorityEnum.HIGH)}</MenuItem>
                            <MenuItem value={PriorityEnum.CRITICAL}>{PriorityEnum.getLabel(PriorityEnum.CRITICAL)}</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{minWidth: 120}}>
                        <InputLabel id="filter-status-label">Status</InputLabel>
                        <Select
                            labelId="filter-status-label"
                            value={filterStatus}
                            label="Status"
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="enabled">Enabled</MenuItem>
                            <MenuItem value="disabled">Disabled</MenuItem>
                        </Select>
                    </FormControl>
                    <Button variant="outlined" startIcon={<SearchIcon/>} onClick={handleSearch}>
                        Search
                    </Button>
                    <Box sx={{flexGrow: 1}}/>
                    <LoadingButton
                        loading={refreshLoading}
                        loadingPosition="start"
                        startIcon={<RefreshIcon/>}
                        variant="contained"
                        onClick={refreshTaskList}
                    >
                        Refresh
                    </LoadingButton>
                    <Button variant="contained" startIcon={<AddIcon/>} onClick={showCreateDialog}>
                        Add
                    </Button>
                </Box>
                {taskListContent}
                <DeleteConfirmDialog ref={taskDeleteConfirmDialogRef} deleteTaskById={deleteTaskList}/>
            </Box>
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
    const {enqueueSnackbar} = useSnackbar();
    const deleteTask = () => {
        httpRequest.delete(`/task/${taskInfo.id}`)
            .then(res => {
                if (res.code === 0) {
                    deleteTaskById(taskInfo.id)
                    enqueueSnackbar("Delete Success", {variant: "success"});
                } else {
                    enqueueSnackbar(res.message, {variant: "error"});
                }
            })
            .catch(err => {
                enqueueSnackbar(err.message, {variant: "error"})
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
