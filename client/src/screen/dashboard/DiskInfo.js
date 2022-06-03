import * as React from "react";
import Typography from "@mui/material/Typography";
import {CircularProgressWithLabel} from "./System";
import Paper from "@mui/material/Paper";
import Title from "./Title";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import {InfoItem} from "./InfoItem";
import ReactECharts from "echarts-for-react";

export const DiskInfo = () => {
    return (
        <React.Fragment>
            <Paper sx={{p: 2, display: 'flex', flexDirection: 'column'}}>
                <Title>Disk</Title>
                <Divider/>
                <Grid container mt={2}>
                    <Grid item xs={4}>
                        <CircularProgressWithLabel value={91}/>
                    </Grid>
                    <Grid item xs={8}>
                        <Grid container spacing={1}>
                            {/*todo 还应该加上我们的log文件所占用的空间内 方便查看清理*/}
                            <InfoItem title="Path" value="/"/>
                            <InfoItem title="File system type" value="ext4"/>
                            <InfoItem title="Total" value="512MB"/>
                            <InfoItem title="Free" value="168Mb"/>
                            <InfoItem title="Used" value="329MB"/>
                        </Grid>
                    </Grid>
                </Grid>
            </Paper>
        </React.Fragment>
    )
}