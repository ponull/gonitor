import * as React from "react";
import {CircularProgressWithLabel, getOption} from "./System";
import Paper from "@mui/material/Paper";
import Title from "./Title";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import {InfoItem} from "./InfoItem";
import ReactECharts from "echarts-for-react";
import {useEffect, useRef} from "react";
import httpRequest from "../../common/request/HttpRequest";
import {SubscribeType, useSubscribe} from "../../common/socket/Websocket";
import {SystemMonitorTypeEnum} from "../../enum/subsciption";
import {useState} from "react";
import {useInterval} from "../../common/utils/hook";
import moment from "moment";

export const MemoryInfo = () => {
    const echartsRef = useRef(null);
    const [echartsOption, setEchartsOption] = useState(getOption());
    const [usedList, setUsedList] = useState([]);
    useInterval(()=>{
        if (usedList.length > 60) {
            usedList.shift();
        }
        const newSecondInfo = [
            moment().format("HH:mm:ss"),
            memoryInfo.used_percent.toFixed(2),
        ]
        const newUsedList = [...usedList, newSecondInfo];
        setUsedList(newUsedList);
    },1000)
    useEffect(() => {
        let newOption = echartsOption;
        const dateList = usedList.map(function (item) {
            return item[0];
        });
        const valueList = usedList.map(function (item) {
            return item[1];
        });
        newOption.xAxis.data = dateList;
        newOption.series[0].data = valueList;
        setEchartsOption(newOption);
        echartsRef && echartsRef.current.getEchartsInstance().setOption(newOption);
    }, [usedList]);
    const [memoryInfo, setMemoryInfo] = React.useState({
        total: 0,
        used: 0,
        free: 0,
        used_percent: 0,
        swap_total: 0,
        swap_used: 0,
        swap_free: 0,
        swap_used_percent: 0,
    });

    useSubscribe(SubscribeType.SYSTEM_MONITOR,SystemMonitorTypeEnum.MEMORY_INFO,(data)=>{
        setMemoryInfo({
            ...memoryInfo,
            ...data,
        });
    })
    useEffect(() => {
        httpRequest.get("/getMemoryInfo")
            .then(res => {
                setMemoryInfo(res.data);
            })
    }, [])
    return (
        <React.Fragment>
            <Paper sx={{p: 2, display: 'flex', flexDirection: 'column'}}>
                <Title>Memory</Title>
                <Divider/>
                <Grid container mt={2}>
                    <Grid item xs={2}>
                        <CircularProgressWithLabel value={memoryInfo.used_percent}/>
                    </Grid>
                    <Grid item xs={4}>
                        <Grid container spacing={1}>
                            <InfoItem title="Total" value={bytesToSize(memoryInfo.total)}/>
                            <InfoItem title="Used" value={bytesToSize(memoryInfo.used)}/>
                            <InfoItem title="Available" value={bytesToSize(memoryInfo.free)}/>
                            <InfoItem title="Used Percent" value={`${memoryInfo.used_percent.toFixed(2)}%`}/>
                        </Grid>
                    </Grid>
                    <Grid item xs={6}>
                        <ReactECharts  ref={(e) => (echartsRef.current = e)}  option={echartsOption}/>
                    </Grid>
                </Grid>
            </Paper>
        </React.Fragment>
    )
}

function bytesToSize(bytes) {
    if (bytes === 0) return '0 B';
    let k = 1024, // or 1024
        sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        i = Math.floor(Math.log(bytes) / Math.log(k));

    return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
}