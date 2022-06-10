import {useState} from "react";
import {SubscribeType, useSubscribe} from "../../common/socket/Websocket";
import * as React from "react";
import {useNavigate} from "react-router-dom";
import httpRequest from "../../common/request/HttpRequest";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import {StrategyEnum} from "../../enum/task";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import {Button, ButtonGroup, ClickAwayListener, Grow, Popper} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import Paper from "@mui/material/Paper";
import {useSnackbar} from "notistack";
import LoadingButton from "@mui/lab/LoadingButton";


export const TaskRow = (props) => {
    const {taskInfo, index, showConfirmDeleteDialog, showEditDialog} = props;
    const [selfTaskInfo, setSelfTaskInfo] = useState(taskInfo);
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

                        {selfTaskInfo.is_disable ? <StartButtonItem taskId={selfTaskInfo.id}/> : <StopButtonItem taskId={selfTaskInfo.id}/>}
                        <Button onClick={() => {
                            setMenuOpen(true)
                        }}>
                            <ArrowDropDownIcon/>
                        </Button>
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
                                                <Button onClick={gotoTaskInfo}>Detail</Button>
                                                <Button onClick={()=>{showEditDialog(selfTaskInfo)}}>Edit</Button>
                                                <Button onClick={()=>{showConfirmDeleteDialog(selfTaskInfo)}}>Delete</Button>
                                                {selfTaskInfo.is_disable ? "" : <Button key="two">Kill Stop</Button>}
                                                <TestButtonItem taskId={selfTaskInfo.id}/>
                                            </ButtonGroup>
                                    </ClickAwayListener>
                                </Paper>
                            </Grow>
                        )}
                    </Popper>
                </TableCell>
            </TableRow>
            {/*<TaskLogContainer open={open} taskId={selfTaskInfo.id}/>*/}
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
            onClick={startTask}
            variant="contained"
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
            onClick={stopTask}
            variant="contained"
        >
            Stop
        </LoadingButton>
    )
}