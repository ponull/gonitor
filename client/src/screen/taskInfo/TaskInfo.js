import * as React from "react";
import {useParams} from "react-router-dom";
import {useEffect, useRef, useState} from "react";
import httpRequest from "../../common/request/HttpRequest";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";

import Paper from '@mui/material/Paper';

import {styled} from '@mui/material/styles';
import DoDisturbOnIcon from '@mui/icons-material/DoDisturbOn';
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
import {InfoItem} from "./InfoItem";
import {useInterval} from "../../common/utils/hook";
import moment from "moment";
import ReactECharts from "echarts-for-react";

export const TaskInfo = () => {
    const params = useParams()
    const taskId = params.taskId
    const [taskInfo, setTaskInfo] = useState({
        command: "",
        exec_strategy: 0,
        exec_type: "",
        id: 0,
        is_disable: true,
        last_run_time: "",
        name: "",
        next_run_time: "",
        retry_interval: 0,
        retry_times: 0,
        running_count: 0,
        schedule: "",
        update_time: "",
    })
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
                        <TaskLogList taskId={taskUpdateInfo.id}></TaskLogList>
                    </TableBody>
                </Table>
            </Container>
        </React.Fragment>
    )
}

const TaskInfoContent = (props) => {
    const {taskInfo} = props

    const echartsRef = useRef(null);
    const [echartsOption, setEchartsOption] = useState(getOption);
    const [usedList, setUsedList] = useState([]);
    useInterval(() => {
        if (usedList.length > 60) {
            usedList.shift();
        }
        const newSecondInfo = [
            moment().format("HH:mm:ss"),
            taskInfo.running_count,
        ]
        const newUsedList = [...usedList, newSecondInfo];
        setUsedList(newUsedList);
    }, 1000)
    useEffect(() => {
        let newOption = echartsOption;
        const dateList = usedList.map(function (item) {
            return item[0];
        });
        const valueList = usedList.map(function (item) {
            return item[1];
        });
        newOption.xAxis.data = dateList;
        newOption.series.data = valueList;
        setEchartsOption(newOption);
        echartsRef && echartsRef.current.getEchartsInstance().setOption(newOption);
    }, [usedList]);
    return (
        <React.Fragment>
            <Paper>
                <Grid container sx={{p: 2, mt: 2}}>
                    <Grid item xs={6}>
                        <InfoItem title="Name" value={taskInfo.name}/>
                        <InfoItem title="Schedule" value={taskInfo.schedule}/>
                        <InfoItem title="Execute Type" value={taskInfo.exec_type}/>
                        <InfoItem title="Disable" value={taskInfo.is_disable ? <DoDisturbOnIcon color="danger"/> : <RunCircleIcon color="success"/> }/>
                        <InfoItem title="Last run time" value={taskInfo.last_run_time}/>
                        <InfoItem title="Next run time" value={taskInfo.next_run_time}/>
                        <InfoItem title="Running Count" value={taskInfo.running_count}/>
                    </Grid>
                    <Grid item xs={6}>
                        <ReactECharts ref={(e) => (echartsRef.current = e)} option={echartsOption}/>
                    </Grid>
                </Grid>
            </Paper>
        </React.Fragment>
    )
}

export const getOption = () => {
    const data = [["2000-06-05", 116], ["2000-06-06", 129], ["2000-06-07", 135], ["2000-06-08", 86], ["2000-06-09", 73], ["2000-06-10", 85], ["2000-06-11", 73], ["2000-06-12", 68], ["2000-06-13", 92], ["2000-06-14", 130], ["2000-06-15", 245], ["2000-06-16", 139], ["2000-06-17", 115], ["2000-06-18", 111], ["2000-06-19", 309], ["2000-06-20", 206], ["2000-06-21", 137], ["2000-06-22", 128], ["2000-06-23", 85], ["2000-06-24", 94], ["2000-06-25", 71], ["2000-06-26", 106], ["2000-06-27", 84], ["2000-06-28", 93], ["2000-06-29", 85], ["2000-06-30", 73], ["2000-07-01", 83], ["2000-07-02", 125], ["2000-07-03", 107], ["2000-07-04", 82], ["2000-07-05", 44], ["2000-07-06", 72], ["2000-07-07", 106], ["2000-07-08", 107], ["2000-07-09", 66], ["2000-07-10", 91], ["2000-07-11", 92], ["2000-07-12", 113], ["2000-07-13", 107], ["2000-07-14", 131], ["2000-07-15", 111], ["2000-07-16", 64], ["2000-07-17", 69], ["2000-07-18", 88], ["2000-07-19", 77], ["2000-07-20", 83], ["2000-07-21", 111], ["2000-07-22", 57], ["2000-07-23", 55], ["2000-07-24", 60]];
    const dateList = data.map(function (item) {
        return item[0];
    });
    const valueList = data.map(function (item) {
        return item[1];
    });
    return {
        tooltip: {
            trigger: 'axis'
        },
        xAxis: {
            data: dateList
        },
        yAxis: [
            {},
        ],
        series: {
            name: 'Beijing AQI',
            type: 'line',
            showSymbol: false,
            data: valueList
        },
    };
}

const TaskLogList = (props) => {
    const {taskId} = props
    const [logList, setLogList] = useState([]);
    useEffect(() => {
            httpRequest.get(`getTaskLogList?task_id=${taskId}`)
                .then(res => {
                    const data = res.data;
                    console.log(data)
                    setLogList(data)
                })
    }, [taskId])
    //给taskLogRow使用 那里面有订阅 检测到结束了  就调用删除
    const deleteLog = (logId) => {
        const newLogList = logList.filter(log => log.id !== logId);
        setLogList(newLogList);
    }
    const [taskLogNew] = useSubscribe(SubscribeType.TASK_LOG_ADD, taskId, {
        "id": 0,
        "task_id": 0,
        "command": "",
        "process_id": 0,
        "execution_time": "",
        "status": true,
        "exec_output": ""
    })
    useEffect(()=>{
        if(taskLogNew.id !== 0){
            setLogList([taskLogNew, ...logList])
        }
    },[taskLogNew])
    return (
        <React.Fragment>
            {logList && logList.map((logInfo, index) => (
                <TaskLogRow key={logInfo.id} deleteLog={deleteLog} logInfo={logInfo}/>
            ))}
        </React.Fragment>
    )
}

const TaskLogRow = (props) => {
    const {logInfo, deleteLog} = props
    const [logUpdateInfo] = useSubscribe(SubscribeType.TASK_lOG, logInfo.id,logInfo)
    useEffect(()=>{
        if(!logUpdateInfo.status){
            setTimeout(()=>{
                deleteLog(logInfo.id)
            },3000)
        }
    }, [logUpdateInfo])
    return (
        <React.Fragment>
                <TableRow key={logInfo.id}>
                    <TableCell component="th" scope="row">
                        {logUpdateInfo.execution_time}
                    </TableCell>
                    <TableCell>{logInfo.command}</TableCell>
                    <TableCell align="right">{logUpdateInfo.process_id}</TableCell>
                    <TableCell align="right">{
                        logUpdateInfo.status ? logUpdateInfo.process_id > 0 ? <RunCircleIcon color="success"/> :
                            <HourglassEmptyIcon/> : <StopCircleIcon color="disabled"/>
                    }</TableCell>
                    <TableCell align="right">
                        <IconButton
                            size="small"
                            color="error"
                            disabled={!logUpdateInfo.status}
                        >
                            <StopCircleIcon/>
                        </IconButton>
                    </TableCell>
                </TableRow>
        </React.Fragment>
    )
}