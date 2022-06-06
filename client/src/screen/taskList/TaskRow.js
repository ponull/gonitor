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
                                        <MenuList id="split-button-menu" autoFocusItem>
                                            <MenuItem onClick={() => {
                                                showEditDialog(selfTaskInfo)
                                            }}>EDIT</MenuItem>
                                            <MenuItem onClick={() => {
                                                showConfirmDeleteDialog(selfTaskInfo)
                                            }}>DELETE</MenuItem>
                                            <TestMenuItem taskId={selfTaskInfo.id}/>
                                            {selfTaskInfo.is_disable ? <StartMenuItem taskId={selfTaskInfo.id}/> :
                                                <React.Fragment>
                                                    <StopMenuItem taskId={selfTaskInfo.id}/>
                                                    <MenuItem>KILL STOP</MenuItem>
                                                </React.Fragment>
                                            }
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

const StartMenuItem = (props) => {
    const {taskId} = props
    const startTask = () => {
        httpRequest.get(`/task/start/${taskId}`)
            .then(res => {
                console.log(res)
            })
    }
    return (
        <MenuItem onClick={startTask}>
            {/*<PlayCircleFilledIcon fontSize="small" />*/}
            Start
        </MenuItem>
    )
}

const TestMenuItem = (props) => {
    const {taskId} = props

    const testTask = () => {
        // fetch(`http://127.0.0.1:8899/task/test/${taskId}`)
        httpRequest.get(`/task/test/${taskId}`)
            .then(res => {
                console.log(res)
            })
            .catch(err => {
                console.log(err)
            })
    }
    return (
        <MenuItem onClick={testTask}>
            {/*<BugReportIcon fontSize="small" />*/}
            Test
        </MenuItem>
    )
}

const StopMenuItem = (props) => {
    const {taskId} = props
    const stopTask = () => {
        httpRequest.get(`/task/stop/${taskId}`)
            .then(res => {
                console.log(res)
            })
    }
    return (
        <MenuItem onClick={stopTask}>STOP</MenuItem>
    )
}