import {useState} from "react";
import {SubscribeType, useSubscribe} from "../../common/socket/Websocket";
import * as React from "react";
import {useNavigate} from "react-router-dom";
import httpRequest from "../../common/request/HttpRequest";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import IconButton from "@mui/material/IconButton";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import {StrategyEnum} from "../../enum/task";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import {Button, ButtonGroup, ClickAwayListener, Grow, ListItemButton, MenuItem, MenuList, Popper} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import Paper from "@mui/material/Paper";
import {TaskLogContainer} from "./TaskLog";
import {useSnackbar} from "notistack";
import LoadingButton from "@mui/lab/LoadingButton";
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import DangerousIcon from '@mui/icons-material/Dangerous';
import EditLocationIcon from '@mui/icons-material/EditLocation';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import BugReportIcon from '@mui/icons-material/BugReport';


export const TaskRow = (props) => {
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
                                            <ButtonGroup
                                                orientation="vertical"
                                                aria-label="vertical contained button group"
                                                variant="text"
                                            >
                                                <Button startIcon={<EditLocationIcon />} onClick={()=>{showEditDialog(selfTaskInfo)}}>Edit</Button>
                                                <Button startIcon={<StopCircleIcon />} onClick={()=>{showConfirmDeleteDialog(selfTaskInfo)}}>Delete</Button>

                                                {selfTaskInfo.is_disable ? <StartButtonItem taskId={selfTaskInfo.id}/> :
                                                    <React.Fragment>
                                                        <StopButtonItem taskId={selfTaskInfo.id}/>
                                                        <Button key="two">Kill Stop</Button>
                                                    </React.Fragment>
                                                }
                                                <TestButtonItem taskId={selfTaskInfo.id}/>
                                            </ButtonGroup>
                                            {/*<MenuList id="split-button-menu" autoFocusItem>*/}
                                            {/*    <MenuItem onClick={() => {*/}
                                            {/*        showEditDialog(selfTaskInfo)*/}
                                            {/*    }}>EDIT</MenuItem>*/}
                                            {/*    <MenuItem onClick={() => {*/}
                                            {/*        showConfirmDeleteDialog(selfTaskInfo)*/}
                                            {/*    }}>DELETE</MenuItem>*/}
                                            {/*    <TestMenuItem taskId={selfTaskInfo.id}/>*/}
                                            {/*    {selfTaskInfo.is_disable ? <StartMenuItem taskId={selfTaskInfo.id}/> :*/}
                                            {/*        <React.Fragment>*/}
                                            {/*            <StopMenuItem taskId={selfTaskInfo.id}/>*/}
                                            {/*            <MenuItem>KILL STOP</MenuItem>*/}
                                            {/*        </React.Fragment>*/}
                                            {/*    }*/}
                                            {/*</MenuList>*/}
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

const StartButtonItem = (props) => {
    const {taskId} = props
    const [loading, setLoading] = useState(false)
    const { enqueueSnackbar } = useSnackbar();
    const startTask = () => {
        setLoading(true)
        httpRequest.get(`/task/start/${taskId}`)
            .then(res => {
                if (res.code !== 0){
                    enqueueSnackbar(res.message)
                }
            })
            .finally(()=>{
                setLoading(false)
            })
    }
    return (
        <LoadingButton
            loading={loading}
            loadingPosition="start"
            startIcon={<PlayCircleFilledWhiteIcon/>}
            onClick={startTask}
            variant="text"
        >
            Start
        </LoadingButton>
    )
}

const TestButtonItem = (props) => {
    const {taskId} = props
    const [loading, setLoading] = useState(false)
    const { enqueueSnackbar } = useSnackbar();
    const testTask = () => {
        setLoading(true)
        httpRequest.get(`/task/test/${taskId}`)
            .then(res => {
                if (res.code !== 0){
                    enqueueSnackbar(res.message)
                }
            })
            .finally(()=>{
                setLoading(false)
            })
    }
    return (
        <LoadingButton
            loading={loading}
            loadingPosition="start"
            startIcon={<BugReportIcon />}
            onClick={testTask}
            variant="text"
        >
            Test
        </LoadingButton>
    )
}

const StopButtonItem = (props) => {
    const {taskId} = props
    const [loading, setLoading] = useState(false)
    const { enqueueSnackbar } = useSnackbar();
    const stopTask = () => {
        setLoading(true)
        httpRequest.get(`/task/stop/${taskId}`)
            .then(res => {
                if (res.code !== 0){
                    enqueueSnackbar(res.message)
                }
            })
            .finally(()=>{
                setLoading(false)
            })
    }
    return (
        <LoadingButton
            loading={loading}
            loadingPosition="start"
            startIcon={<StopCircleIcon/>}
            onClick={stopTask}
            variant="text"
        >
            Stop
        </LoadingButton>
    )
}