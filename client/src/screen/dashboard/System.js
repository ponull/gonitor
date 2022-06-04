import * as React from 'react';
import Title from './Title';
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import ReactECharts from 'echarts-for-react';
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import {InfoItem} from "./InfoItem";
import Box from "@mui/material/Box";
import {useEffect} from "react";


export const SystemInfo = () => {
    const data = [["2000-06-05", 116], ["2000-06-06", 129], ["2000-06-07", 135], ["2000-06-08", 86], ["2000-06-09", 73], ["2000-06-10", 85], ["2000-06-11", 73], ["2000-06-12", 68], ["2000-06-13", 92], ["2000-06-14", 130], ["2000-06-15", 245], ["2000-06-16", 139], ["2000-06-17", 115], ["2000-06-18", 111], ["2000-06-19", 309], ["2000-06-20", 206], ["2000-06-21", 137], ["2000-06-22", 128], ["2000-06-23", 85], ["2000-06-24", 94], ["2000-06-25", 71], ["2000-06-26", 106], ["2000-06-27", 84], ["2000-06-28", 93], ["2000-06-29", 85], ["2000-06-30", 73], ["2000-07-01", 83], ["2000-07-02", 125], ["2000-07-03", 107], ["2000-07-04", 82], ["2000-07-05", 44], ["2000-07-06", 72], ["2000-07-07", 106], ["2000-07-08", 107], ["2000-07-09", 66], ["2000-07-10", 91], ["2000-07-11", 92], ["2000-07-12", 113], ["2000-07-13", 107], ["2000-07-14", 131], ["2000-07-15", 111], ["2000-07-16", 64], ["2000-07-17", 69], ["2000-07-18", 88], ["2000-07-19", 77], ["2000-07-20", 83], ["2000-07-21", 111], ["2000-07-22", 57], ["2000-07-23", 55], ["2000-07-24", 60]];
    const dateList = data.map(function (item) {
        return item[0];
    });
    const valueList = data.map(function (item) {
        return item[1];
    });
    const option = {
        tooltip: {
            trigger: 'axis'
        },
        xAxis: {
            data: dateList
        },
        yAxis: [
            {},
        ],
        series: [
            {
                type: 'line',
                showSymbol: false,
                data: valueList
            },
        ]
    };
    return (
        <React.Fragment>
            <Paper sx={{p: 2, display: 'flex', flexDirection: 'column'}}>
                <Title>System</Title>
                <Divider/>
                <Grid container sx={{mt: 2}} spacing={3}>
                    <Grid item xs={7}>
                        <Grid container spacing={1}>
                            <InfoItem title="OS" value="Windows"/>
                            <InfoItem title="Platform" value="Microsoft Windows 11 Home China"/>
                            <InfoItem title="Kernel" value="10.0.22000 Build 22000"/>
                            <InfoItem title="Kernel Arch" value="x86_64"/>
                            <InfoItem title="Boot Time" value="2022-06-03 09:11:56"/>
                        </Grid>
                    </Grid>
                    <Grid item xs={5}>
                        <Grid container spacing={1}>
                            <InfoItem title="Task" value="6"/>
                            <InfoItem title="Task Process Count" value="6"/>
                        </Grid>
                    </Grid>
                </Grid>
            </Paper>
        </React.Fragment>
    );
}

const originOption = {
    graphic: {
        type: "text",
        left: "center",
        top: "center",
        style: {
            text: `0%`,
            textAlign: "center",
            fill: `#20a53a`,
            fontSize: 30,
        }
    },
    series: [
        {
            // width: size,
            // height: 100,
            type: 'pie',
            hoverAnimation: false,
            legendHoverLink: false,
            borderWidth: 0,
            //环形显示饼状图，实际上显示的是50-80之间的部分
            //上限不建议设置为100，echarts自带动画效果，设置为100动画效果很丑
            radius: ['80%', '90%'],
            data: [
                //itemSyle是单项的背景颜色设置。
                {
                    value: 0,
                    itemStyle: {
                        color: `#20a53a`,
                        borderRadius: [0, 10, 0, 10]
                    }
                },
                {value: 100, itemStyle: {color: '#f1f1f1'}},
            ],
            label: {
                //将视觉引导图关闭
                show: false,
            },
            // itemStyle: {
            //     //设置的是每项之间的留白
            //     borderWidth: 3,
            //     borderColor: '#fff'
            // },
        }
    ]
}
export const CircularProgressWithLabel = (props) => {
    const {value, size} = props;
    const echartsRef = React.useRef(null);
    useEffect(()=>{
        let newOption = originOption;
        const valueInt = Math.floor(value);
        const color = value > 90 ? '#FF0000' : value > 75 ? '#FFA500' : '#20a53a';
        newOption.graphic.style.text = `${valueInt}%`;
        newOption.graphic.style.fill = `${color}`;
        newOption.series[0].data[0].value = `${valueInt}`;
        newOption.series[0].data[1].value = `${100 - valueInt}`;
        newOption.series[0].data[0].itemStyle.color = `${color}`;
        setOption(newOption);
        // console.log(echartsRef.current);
        echartsRef && echartsRef.current.getEchartsInstance().setOption(newOption);
    },[value]);
    const [option, setOption] = React.useState(originOption);
    return (
        // <Box sx={{width: size, height: size}}>
            <ReactECharts ref={(e) => (echartsRef.current = e)} option={option} style={{height:150,width:150}}/>
        // </Box>
        // <Box sx={{ position: 'relative', display: 'inline-flex', flex: 1 }}>
        //     <CircularProgress variant="determinate" {...props} size={100}/>
        //     <Box
        //         sx={{
        //             top: 0,
        //             left: 0,
        //             bottom: 0,
        //             right: 0,
        //             position: 'absolute',
        //             display: 'flex',
        //             alignItems: 'center',
        //             justifyContent: 'center',
        //         }}
        //     >
        //         <Typography variant="caption" component="div" color="text.secondary" sx={{fontSize: 16, fontWeight: 600}}>
        //             {`${Math.round(props.value)}%`}
        //         </Typography>
        //     </Box>
        // </Box>
    );
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
        series: [
            {
                type: 'line',
                showSymbol: false,
                data: valueList
            },
        ]
    };
}