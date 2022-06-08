import {useEffect, useRef, useState} from "react";
import {SubscribeType, useSubscribe} from "../../common/socket/Websocket";
import * as React from "react";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import RunCircleIcon from "@mui/icons-material/RunCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import IconButton from "@mui/material/IconButton";
import {Button, Collapse, DialogActions, DialogContent, DialogContentText, DialogTitle} from "@mui/material";
import Box from "@mui/material/Box";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import httpRequest from "../../common/request/HttpRequest";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import Dialog from "@mui/material/Dialog";
import FactCheckIcon from '@mui/icons-material/FactCheck';
import Paper from "@mui/material/Paper";
import {TaskExecOutputDialog} from "./TaskExecOutputDialog";


export const TaskLogTable = (props) => {
    const {taskId} = props
    const [logList, setLogList] = useState([]);
    useEffect(() => {
        httpRequest.get(`/task/log/list/running/${taskId}`)
            .then(res => {
                const data = res.data;
                setLogList(data)
            })
    }, [taskId])
    //给taskLogRow使用 那里面有订阅 检测到结束了  就调用删除
    const deleteLog = (logId) => {
        const newLogList = logList.filter(log => log.id !== logId);
        setLogList(newLogList);
    }
    useSubscribe(SubscribeType.TASK_LOG_ADD, taskId, (data) => {
        setLogList([
            data,
            ...logList
        ]);
    })
    return (
        <React.Fragment>
            <Paper>
                <Table>
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
                        {logList && logList.map((logInfo, index) => (
                            <TaskLogRow key={logInfo.id} deleteLog={deleteLog} logInfo={logInfo}/>
                        ))}
                    </TableBody>
                </Table>
            </Paper>

        </React.Fragment>
    )
}

const TaskLogRow = (props) => {
    const {logInfo, deleteLog} = props
    const [selfLogInfo, setSelfLogInfo] = useState(logInfo);
    const [open, setOpen] = useState(false);
    useSubscribe(SubscribeType.TASK_lOG, logInfo.id,(data) => {
        setSelfLogInfo({
            ...selfLogInfo,
            ...data
        })
    })
    const latestDeleteCallback = useRef(() => { });
    useEffect(() => {
        latestDeleteCallback.current = ()=>{
            if(!selfLogInfo.status && !open){
                deleteLog(logInfo.id)
            }
        };
    });
    useEffect(()=>{
        if(!selfLogInfo.status && !open){
            setTimeout(()=>{
                    latestDeleteCallback.current(selfLogInfo.id)
            },3000)
        }
    }, [selfLogInfo, open])
    return (
        <React.Fragment>
            <TableRow key={logInfo.id}>
                <TableCell component="th" scope="row">
                    {selfLogInfo.execution_time}
                </TableCell>
                <TableCell>{logInfo.command}</TableCell>
                <TableCell align="right">{selfLogInfo.process_id}</TableCell>
                <TableCell align="right">{
                    selfLogInfo.status ? selfLogInfo.process_id > 0 ? <RunCircleIcon color="success"/> :
                        <HourglassEmptyIcon/> : <StopCircleIcon color="disabled"/>
                }</TableCell>
                <TableCell align="right">
                    <IconButton
                        size="small"
                        onClick={() => setOpen(!open)}
                    >
                        <FactCheckIcon/>
                    </IconButton>
                    <IconButton
                        size="small"
                        color="error"
                        disabled={!selfLogInfo.status}
                    >
                        <StopCircleIcon/>
                    </IconButton>

                    <TaskExecOutputDialog open={open} execOutput={selfLogInfo.exec_output} closeDialog={()=>{setOpen(false)}}  />
                </TableCell>
            </TableRow>
        </React.Fragment>
    )
}
