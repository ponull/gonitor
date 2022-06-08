import {useEffect, useRef, useState} from "react";
import {SubscribeType, useSubscribe} from "../../common/socket/Websocket";
import httpRequest from "../../common/request/HttpRequest";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import {Collapse} from "@mui/material";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import * as React from "react";
import RunCircleIcon from "@mui/icons-material/RunCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import IconButton from "@mui/material/IconButton";

export const TaskLogContainer = (props: { open: boolean; taskId: number; }) => {
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
        }
        //eslint-disable-next-line
    }, [])
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
    useSubscribe(SubscribeType.TASK_lOG, taskLogInfo.id, (data) => {
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