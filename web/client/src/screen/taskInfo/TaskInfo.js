import * as React from "react";
import {useParams} from "react-router-dom";
import {useEffect, useRef, useState} from "react";
import httpRequest from "../../common/request/HttpRequest";
import Grid from "@mui/material/Grid";
import Paper from '@mui/material/Paper';
import DoDisturbOnIcon from '@mui/icons-material/DoDisturbOn';
import Container from "@mui/material/Container";
import {SubscribeType, useSubscribe} from "../../common/socket/Websocket";
import RunCircleIcon from "@mui/icons-material/RunCircle";
import {InfoItem} from "./InfoItem";
import {useInterval, useScreenSize} from "../../common/utils/hook";
import moment from "moment";
import ReactECharts from "echarts-for-react";
import {TaskLogTable} from "./TaskRunningLog";
import {TabContext, TabList, TabPanel} from "@mui/lab";
import Box from "@mui/material/Box";
import {Tab} from "@mui/material";
import {TaskEndedLog} from "./TaskEndedLog";
import useMediaQuery from "@mui/material/useMediaQuery";

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
    useSubscribe(SubscribeType.TASK, taskId, (data) => {
        setTaskInfo({
            ...taskInfo,
            ...data
        })
    })
    useEffect(() => {
        httpRequest.get(`/task/info/${taskId}`).then(res => {
            if (res.code === 0) {
                setTaskInfo(res.data)
            }
        }).catch(err => {
        })
            .finally(() => {
            })
    }, [taskId])

    const [currentTab, setCurrentTab] = React.useState('running');

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    return (
        <React.Fragment>
            <Container>
                <TaskInfoContent taskInfo={taskInfo}/>
                <TabContext value={currentTab}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <TabList onChange={handleTabChange} aria-label="lab API tabs example">
                            <Tab label="Running" value="running" />
                            <Tab label="Ended" value="ended" />
                        </TabList>
                    </Box>
                    <TabPanel value="running" sx={{p:1}}>
                        <TaskLogTable taskId={taskId}/>
                    </TabPanel>
                    <TabPanel value="ended" sx={{p:1}}>
                        <TaskEndedLog taskId={taskId}/>
                    </TabPanel>
                </TabContext>
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

    const {isDesktop} = useScreenSize();
    return (
        <React.Fragment>
            <Paper>
                <Grid container sx={{p: 2, mt: 2}}>
                    <Grid item xs={12} md={6}>
                        <InfoItem title="Name" value={taskInfo.name}/>
                        <InfoItem title="Schedule" value={taskInfo.schedule}/>
                        <InfoItem title="Execute Type" value={taskInfo.exec_type}/>
                        <InfoItem title="Disable" value={taskInfo.is_disable ? <DoDisturbOnIcon color="danger"/> :
                            <RunCircleIcon color="success"/>}/>
                        <InfoItem title="Last run time" value={taskInfo.last_run_time}/>
                        <InfoItem title="Next run time" value={taskInfo.next_run_time}/>
                        <InfoItem title="Running Count" value={taskInfo.running_count}/>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <ReactECharts style={{height:isDesktop?300:200}} ref={(e) => (echartsRef.current = e)} option={echartsOption}/>
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

