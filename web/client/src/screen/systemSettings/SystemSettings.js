import * as React from 'react';
import {useEffect, useState} from "react";
import {
    Alert,
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Grid,
    List,
    ListItem,
    ListItemText,
    Stack,
    Typography
} from "@mui/material";
import httpRequest from "../../common/request/HttpRequest";

export const SystemSettings = function () {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        httpRequest.get("/system/settings")
            .then(res => {
                if (res.code !== 0) {
                    setError(res.message || "Load settings failed");
                    return;
                }
                setSettings(res.data);
            })
            .catch(err => {
                setError(err.message || "Load settings failed");
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <Box sx={{p: 3, display: "flex", justifyContent: "center"}}>
                <CircularProgress/>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{p: 3}}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (!settings) {
        return (
            <Box sx={{p: 3}}>
                <Alert severity="info">暂无系统设置信息</Alert>
            </Box>
        );
    }

    const metricItems = [
        {label: "任务总数", value: settings.counts?.tasks ?? 0},
        {label: "启用任务", value: settings.counts?.enabled_tasks ?? 0},
        {label: "依赖任务", value: settings.counts?.dependency_tasks ?? 0},
        {label: "超时保护任务", value: settings.counts?.timeout_tasks ?? 0},
        {label: "节点数", value: settings.counts?.nodes ?? 0},
        {label: "在线节点", value: settings.counts?.online_nodes ?? 0},
        {label: "用户数", value: settings.counts?.users ?? 0},
        {label: "调度内存组数", value: settings.counts?.running_task_groups ?? 0},
    ];

    return (
        <Box sx={{p: 3}}>
            <Stack spacing={3}>
                <Box>
                    <Typography variant="h5" gutterBottom>系统设置</Typography>
                    <Typography variant="body2" color="text.secondary">
                        汇总 Phase 0-4 已落地的基础能力，包括任务超时、依赖调度、指标导出以及导入导出入口。
                    </Typography>
                </Box>

                <Grid container spacing={2}>
                    {metricItems.map(item => (
                        <Grid item xs={12} sm={6} md={3} key={item.label}>
                            <Card>
                                <CardContent>
                                    <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                                    <Typography variant="h5">{item.value}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>运行信息</Typography>
                                <List dense>
                                    <ListItem><ListItemText primary="版本" secondary={settings.version}/></ListItem>
                                    <ListItem><ListItemText primary="构建时间" secondary={settings.build_time}/></ListItem>
                                    <ListItem><ListItemText primary="提交" secondary={settings.git_commit}/></ListItem>
                                    <ListItem><ListItemText primary="组件" secondary={settings.component}/></ListItem>
                                    <ListItem><ListItemText primary="Go 版本" secondary={settings.go_version}/></ListItem>
                                    <ListItem><ListItemText primary="数据库驱动" secondary={settings.database?.driver}/></ListItem>
                                    <ListItem><ListItemText primary="HTTP 监听" secondary={`${settings.http_server?.host}:${settings.http_server?.port}`}/></ListItem>
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>脚本与接口</Typography>
                                <List dense>
                                    <ListItem><ListItemText primary="脚本目录" secondary={settings.script?.folder}/></ListItem>
                                    <ListItem><ListItemText primary="日志目录" secondary={settings.script?.log_folder}/></ListItem>
                                    <ListItem><ListItemText primary="健康检查" secondary="/healthz /readyz"/></ListItem>
                                    <ListItem><ListItemText primary="Prometheus 指标" secondary="/metrics (Token 鉴权)"/></ListItem>
                                    <ListItem><ListItemText primary="任务导出" secondary="/task/export"/></ListItem>
                                    <ListItem><ListItemText primary="任务导入" secondary="/task/import"/></ListItem>
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>已启用能力</Typography>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                            {Object.entries(settings.features || {}).map(([key, enabled]) => (
                                <Chip
                                    key={key}
                                    label={key}
                                    color={enabled ? "primary" : "default"}
                                    variant={enabled ? "filled" : "outlined"}
                                    sx={{mb: 1}}
                                />
                            ))}
                        </Stack>
                    </CardContent>
                </Card>
            </Stack>
        </Box>
    );
}
