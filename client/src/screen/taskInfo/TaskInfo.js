import * as React from "react";
import {useParams} from "react-router-dom";
import {useEffect, useRef, useState} from "react";
import httpRequest from "../../common/request/HttpRequest";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";

import Paper from '@mui/material/Paper';

import {styled} from '@mui/material/styles';
import Container from "@mui/material/Container";
import {SubscribeType, useSubscribe} from "../../common/socket/Websocket";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import RunCircleIcon from "@mui/icons-material/RunCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import IconButton from "@mui/material/IconButton";

export const TaskInfo = () => {
    const params = useParams()
    const taskId = params.taskId
    const [taskInfo, setTaskInfo] = useState({})
    const [taskUpdateInfo] = useSubscribe(SubscribeType.TASK, taskInfo.id, taskInfo)
    useEffect(() => {
        httpRequest.get("/getTaskInfo?task_id=" + taskId).then(res => {
            if (res.code === 0) {
                setTaskInfo(res.data)
            }
        }).catch(err => {
        })
            .finally(() => {
            })
    }, [taskId])
    return (
        <React.Fragment>
            <Container>
                <TaskInfoContent taskInfo={taskUpdateInfo}/>
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
                        <TaskLogList taskId={taskInfo.id}></TaskLogList>
                    </TableBody>
                </Table>
            </Container>
        </React.Fragment>
    )
}

const TaskInfoItemTitle = styled("span")({
    fontSize: "1.2rem",
})

const TaskInfoItemValue = styled("span")({
    fontSize: "1rem",
})

const TaskInfoContent = (props) => {
    const {taskInfo} = props
    return (
        <React.Fragment>
            <Paper>
                <Grid container>
                    <Grid item xs={12}>
                        <Typography variant="h6" sx={{mt: 2}}>
                            {taskInfo.name}
                        </Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <TaskInfoItemTitle>Schedule</TaskInfoItemTitle>
                        <TaskInfoItemValue>{taskInfo.schedule}</TaskInfoItemValue>
                    </Grid>
                    <Grid item xs={6}>
                        <TaskInfoItemTitle>Execute Type</TaskInfoItemTitle>
                        <TaskInfoItemValue>{taskInfo.execType}</TaskInfoItemValue>
                    </Grid>
                    <Grid item xs={6}>
                        <TaskInfoItemTitle>isSingleton</TaskInfoItemTitle>
                        <TaskInfoItemValue>{taskInfo.isSingleton}</TaskInfoItemValue>
                    </Grid>
                    <Grid item xs={6}>
                        <TaskInfoItemTitle>isDisable</TaskInfoItemTitle>
                        <TaskInfoItemValue>{taskInfo.isDisable}</TaskInfoItemValue>
                    </Grid>
                    <Grid item xs={6}>
                        <TaskInfoItemTitle>runningCount</TaskInfoItemTitle>
                        <TaskInfoItemValue>{taskInfo.runningCount}</TaskInfoItemValue>
                    </Grid>
                    <Grid item xs={6}>
                        <Grid container>
                            <Grid item xs={6}>
                                <TaskInfoItemTitle>Last run time</TaskInfoItemTitle>
                                <TaskInfoItemValue>{taskInfo.lastRunTime}</TaskInfoItemValue>
                            </Grid>
                            <Grid item xs={6}>
                                <TaskInfoItemTitle>Next run time</TaskInfoItemTitle>
                                <TaskInfoItemValue>{taskInfo.nextRunTime}</TaskInfoItemValue>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Paper>
        </React.Fragment>
    )
}

const TaskLogList = (props) => {
    const {taskId} = props
    const [logList, setLogList] = useState([]);
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
    })
    return (
        <React.Fragment>
            {logList && logList.map((logInfo, index) => (
                <TableRow key={logInfo.id}>
                    <TableCell component="th" scope="row">
                        {logInfo.execution_time}
                    </TableCell>
                    <TableCell>{logInfo.command}</TableCell>
                    <TableCell align="right">{logInfo.process_id}</TableCell>
                    <TableCell align="right">{
                        logInfo.status ? logInfo.process_id > 0 ? <RunCircleIcon color="success"/> :
                            <HourglassEmptyIcon/> : <StopCircleIcon color="disabled"/>
                    }</TableCell>
                    <TableCell align="right">
                        <IconButton
                            size="small"
                            color="error"
                            disabled={!logInfo.status}
                        >
                            <StopCircleIcon/>
                        </IconButton>
                    </TableCell>
                </TableRow>
            ))}
        </React.Fragment>
    )
}