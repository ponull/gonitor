import * as React from "react";
import {CircularProgressWithLabel, getOption} from "./System";
import Paper from "@mui/material/Paper";
import Title from "./Title";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import {InfoItem} from "./InfoItem";
import ReactECharts from "echarts-for-react";
import {useEffect, useRef, useState} from "react";
import httpRequest from "../../common/request/HttpRequest";
import {SubscribeType, useSubscribe} from "../../common/socket/Websocket";
import {SystemMonitorTypeEnum} from "../../enum/subsciption";
import moment from "moment";
import {useInterval} from "../../common/utils/hook";
import useMediaQuery from "@mui/material/useMediaQuery";

export const CpuInfo = () => {
    const echartsRef = useRef(null);
    const [echartsOption, setEchartsOption] = useState(getOption);
    const [usedList, setUsedList] = useState([]);
    useInterval(()=>{
        if (usedList.length > 60) {
            usedList.shift();
        }
        const newSecondInfo = [
            moment().format("HH:mm:ss"),
            cpuInfo.total_percent.toFixed(2),
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
    const [cpuInfo, setCpuInfo] = React.useState({
        physical_cores_count: 0,
        logical_cores_count: 0,
        total_percent: 0,
    });
    useSubscribe(SubscribeType.SYSTEM_MONITOR, SystemMonitorTypeEnum.CPU_INFO, (data) => {
        setCpuInfo({
            ...cpuInfo,
            ...data
        })
    })
    useEffect(() => {
        httpRequest.get("/system/cpu")
            .then(res => {
                setCpuInfo(res.data);
            })
    }, [])

    const isDesktop = useMediaQuery('(min-width:600px)');
    const size = isDesktop ? 150 : 80;
    return (
        <React.Fragment>
            <Paper sx={{p: 2, display: 'flex', flexDirection: 'column'}}>
                <Title>Cpu</Title>
                <Divider/>
                <Grid container mt={2} spacing={3}>
                    <Grid item xs={4} md={2}>
                        <CircularProgressWithLabel value={cpuInfo.total_percent} size={size}/>
                    </Grid>
                    <Grid item xs={8} md={4}>
                        <Grid container spacing={1}>
                            <InfoItem title="Physical Count" value={cpuInfo.physical_cores_count}/>
                            <InfoItem title="Logical Count" value={cpuInfo.logical_cores_count}/>
                            <InfoItem title="Cpu Percent" value={`${cpuInfo.total_percent.toFixed(2)}%`}/>
                        </Grid>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <ReactECharts  ref={(e) => (echartsRef.current = e)} option={echartsOption}/>
                    </Grid>
                </Grid>
            </Paper>
        </React.Fragment>
    )
}
