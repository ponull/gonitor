import * as React from "react";
import {CircularProgressWithLabel} from "./System";
import Paper from "@mui/material/Paper";
import Title from "./Title";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import {InfoItem} from "./InfoItem";
import {useEffect, useState} from "react";
import httpRequest from "../../common/request/HttpRequest";
import useMediaQuery from "@mui/material/useMediaQuery";
import {useScreenSize} from "../../common/utils/hook";

export const DiskInfo = () => {
    const [usedPercent, setUsedPercent] = useState(0);
    const [diskInfo, setDiskInfo] = useState({
        total: 0,
        file_system: "",
        used: 0,
        free: 0,
        log_used: 0,
    })
    useEffect(() => {
        httpRequest.get("/system/disk")
            .then(res => {
                setDiskInfo(res.data);
            })
    }, [])
    useEffect(()=>{
        setUsedPercent(diskInfo.used / diskInfo.total * 100)
    },[diskInfo])

    const {isDesktop} = useScreenSize();
    const size = isDesktop ? 150 : 80;
    return (
        <React.Fragment>
            <Paper sx={{p: 2, display: 'flex', flexDirection: 'column'}}>
                <Title>Disk</Title>
                <Divider/>
                <Grid container mt={2}>
                    <Grid item xs={4}>
                        <CircularProgressWithLabel value={usedPercent} size={size}/>
                    </Grid>
                    <Grid item xs={8}>
                        <Grid container spacing={1}>
                            {/*todo 还应该加上我们的log文件所占用的空间内 方便查看清理*/}
                            <InfoItem title="Path" value="/"/>
                            <InfoItem title="File system type" value={diskInfo.file_system}/>
                            <InfoItem title="Total" value={bytesToSize(diskInfo.total)}/>
                            <InfoItem title="Free" value={bytesToSize(diskInfo.free)}/>
                            <InfoItem title="Used" value={bytesToSize(diskInfo.used)}/>
                            <InfoItem title="used Percent" value={`${usedPercent.toFixed(2)}%`}/>
                            <InfoItem title="Log Used" value={bytesToSize(diskInfo.log_used)}/>
                        </Grid>
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