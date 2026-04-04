import * as React from "react";
import {forwardRef, useEffect, useImperativeHandle, useRef, useState} from "react";
import Box from "@mui/material/Box";
import LoadingButton from "@mui/lab/LoadingButton";
import {Refresh as RefreshIcon} from "@mui/icons-material";
import {
    Button,
    Chip,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    LinearProgress,
    Skeleton,
    TextField,
    Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import httpRequest from "../../common/request/HttpRequest";
import Paper from "@mui/material/Paper";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import Table from "@mui/material/Table";
import TableContainer from "@mui/material/TableContainer";
import {useSnackbar} from "notistack";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Typography from "@mui/material/Typography";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";

const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return "-";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i];
};

export const NodeList = () => {
    const [nodeList, setNodeList] = useState([]);
    const nodeAddRef = useRef(null);
    const nodeEditRef = useRef(null);
    const nodeDeleteConfirmRef = useRef(null);
    const nodeDeployRef = useRef(null);
    const nodeDeployNewRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [refreshLoading, setRefreshLoading] = useState(false);
    const [expandedNodeId, setExpandedNodeId] = useState(null);
    const [nodeEditInfo, setNodeEditInfo] = useState({
        id: 0,
        name: "",
        region: "",
        address: "",
        remark: "",
    });
    const {enqueueSnackbar} = useSnackbar();

    const getNodeList = async () => {
        const res = await httpRequest.get("/node/list");
        if (res.code !== 0) {
            enqueueSnackbar(res.message, {variant: "error"});
            return;
        }
        setNodeList(res.data || []);
    };

    const refreshNodeList = () => {
        setRefreshLoading(true);
        getNodeList().then(() => {
            setRefreshLoading(false);
        });
    };

    const firstRenderRef = useRef(true);
    useEffect(() => {
        if (!firstRenderRef.current) return;
        firstRenderRef.current = false;
        getNodeList().then(() => setLoading(false));
    }, []);

    const showCreateDialog = () => {
        nodeAddRef.current?.handleClickOpen();
    };
    const showEditDialog = (nodeInfo) => {
        setNodeEditInfo(nodeInfo);
        nodeEditRef.current?.handleClickOpen();
    };
    const showDeleteDialog = (nodeInfo) => {
        nodeDeleteConfirmRef.current?.handleClickOpen(nodeInfo);
    };
    const showDeployDialog = (nodeInfo) => {
        nodeDeployRef.current?.handleClickOpen(nodeInfo);
    };
    const showDeployNewDialog = () => {
        nodeDeployNewRef.current?.handleClickOpen();
    };

    const handleRegenerateKey = (nodeId) => {
        httpRequest.get(`/node/regenerate/${nodeId}`)
            .then(res => {
                if (res.code !== 0) {
                    enqueueSnackbar(res.message, {variant: "error"});
                    return;
                }
                enqueueSnackbar("密钥已重新生成", {variant: "success"});
                refreshNodeList();
            })
            .catch(() => enqueueSnackbar("操作失败", {variant: "error"}));
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            enqueueSnackbar("已复制到剪贴板", {variant: "success"});
        }).catch(() => {
            enqueueSnackbar("复制失败", {variant: "error"});
        });
    };

    const toggleExpand = (nodeId) => {
        setExpandedNodeId(expandedNodeId === nodeId ? null : nodeId);
    };

    return (
        <Box sx={{m: 2}}>
            <NodeAdd ref={nodeAddRef} refreshNodeList={refreshNodeList}/>
            <NodeEdit ref={nodeEditRef} refreshNodeList={refreshNodeList} nodeInfo={nodeEditInfo}/>
            <DeleteConfirmDialog ref={nodeDeleteConfirmRef} refreshNodeList={refreshNodeList}/>
            <NodeDeployDialog ref={nodeDeployRef} refreshNodeList={refreshNodeList}/>
            <NodeDeployNewDialog ref={nodeDeployNewRef} refreshNodeList={refreshNodeList}/>
            <Box sx={{mb: 2, display: "flex", justifyContent: "flex-end"}}>
                <LoadingButton
                    loading={refreshLoading}
                    loadingPosition="start"
                    startIcon={<RefreshIcon/>}
                    variant="contained"
                    sx={{mr: 2}}
                    onClick={refreshNodeList}
                >
                    刷新
                </LoadingButton>
                <Button variant="contained" startIcon={<AddIcon/>} onClick={showCreateDialog} sx={{mr: 2}}>
                    添加节点
                </Button>
                <Button variant="contained" color="secondary" startIcon={<RocketLaunchIcon/>}
                        onClick={showDeployNewDialog}>
                    一键部署新节点
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table sx={{minWidth: 650}} aria-label="node table">
                    <TableHead>
                        <TableRow>
                            <TableCell width={40}/>
                            <TableCell>No.</TableCell>
                            <TableCell>节点名称</TableCell>
                            <TableCell>区域</TableCell>
                            <TableCell>地址 / IP</TableCell>
                            <TableCell align="center">状态</TableCell>
                            <TableCell align="center">类型</TableCell>
                            <TableCell>系统信息</TableCell>
                            <TableCell>密钥</TableCell>
                            <TableCell align="right">操作</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ?
                            new Array(3).fill(0).map((_, rowIdx) => (
                                <TableRow key={"row" + rowIdx}>
                                    {new Array(10).fill(0).map((_, cellIdx) => (
                                        <TableCell key={"row" + rowIdx + "cell" + cellIdx}>
                                            <Skeleton variant="text"/>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                            : nodeList && nodeList.map((node, inx) => (
                            <React.Fragment key={node.id}>
                                <TableRow>
                                    <TableCell>
                                        {!node.is_master && (
                                            <IconButton size="small" onClick={() => toggleExpand(node.id)}>
                                                {expandedNodeId === node.id ? <KeyboardArrowUpIcon/> :
                                                    <KeyboardArrowDownIcon/>}
                                            </IconButton>
                                        )}
                                    </TableCell>
                                    <TableCell>{inx + 1}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={500}>{node.name}</Typography>
                                    </TableCell>
                                    <TableCell>{node.region}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{fontFamily: "monospace"}}>
                                            {node.is_master ? "-" : node.address}
                                        </Typography>
                                        {node.ip && !node.is_master && (
                                            <Typography variant="caption" color="text.secondary"
                                                        sx={{display: "block"}}>
                                                IP: {node.ip}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={node.status === 1 ? "在线" : "离线"}
                                            color={node.status === 1 ? "success" : "default"}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={node.is_master ? "主节点" : "边缘节点"}
                                            color={node.is_master ? "primary" : "secondary"}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {node.os ? (
                                            <Box>
                                                <Typography variant="caption">
                                                    {node.os}{node.arch ? ` / ${node.arch}` : ""}
                                                </Typography>
                                                {node.cpu_cores > 0 && (
                                                    <Typography variant="caption" color="text.secondary"
                                                                sx={{display: "block"}}>
                                                        {node.cpu_cores} 核 / {formatBytes(node.memory_total)}
                                                    </Typography>
                                                )}
                                            </Box>
                                        ) : "-"}
                                    </TableCell>
                                    <TableCell>
                                        {!node.is_master && node.secret_key ? (
                                            <Box sx={{display: "flex", alignItems: "center", gap: 0.5}}>
                                                <Typography variant="body2"
                                                            sx={{fontFamily: "monospace", fontSize: 12}}>
                                                    {node.secret_key.substring(0, 8)}...
                                                </Typography>
                                                <Tooltip title="复制密钥">
                                                    <IconButton size="small"
                                                                onClick={() => copyToClipboard(node.secret_key)}>
                                                        <ContentCopyIcon fontSize="small"/>
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        ) : "-"}
                                    </TableCell>
                                    <TableCell align="right">
                                        {!node.is_master && (
                                            <Box sx={{display: "flex", justifyContent: "flex-end", gap: 0.5}}>
                                                <Tooltip title="SSH部署">
                                                    <IconButton size="small" color="secondary"
                                                                onClick={() => showDeployDialog(node)}>
                                                        <CloudUploadIcon fontSize="small"/>
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="编辑">
                                                    <IconButton size="small" onClick={() => showEditDialog(node)}>
                                                        <EditIcon fontSize="small"/>
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="重新生成密钥">
                                                    <IconButton size="small"
                                                                onClick={() => handleRegenerateKey(node.id)}>
                                                        <VpnKeyIcon fontSize="small"/>
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="删除">
                                                    <IconButton size="small" color="error"
                                                                onClick={() => showDeleteDialog(node)}>
                                                        <DeleteIcon fontSize="small"/>
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        )}
                                    </TableCell>
                                </TableRow>
                                {!node.is_master && (
                                    <TableRow>
                                        <TableCell colSpan={10} sx={{py: 0, borderBottom: expandedNodeId === node.id ? undefined : "none"}}>
                                            <Collapse in={expandedNodeId === node.id} timeout="auto" unmountOnExit>
                                                <NodeDetailPanel node={node}/>
                                            </Collapse>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        ))
                        }
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

// Node Detail Panel - shows expanded system info
const NodeDetailPanel = ({node}) => {
    return (
        <Box sx={{p: 2, bgcolor: "grey.50"}}>
            <Typography variant="subtitle2" gutterBottom sx={{display: "flex", alignItems: "center", gap: 1}}>
                <InfoOutlinedIcon fontSize="small"/>
                节点详细信息
            </Typography>
            <Divider sx={{mb: 1.5}}/>
            <Grid container spacing={2}>
                <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">IP 地址</Typography>
                    <Typography variant="body2" sx={{fontFamily: "monospace"}}>{node.ip || "-"}</Typography>
                </Grid>
                <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">操作系统</Typography>
                    <Typography variant="body2">{node.os || "-"}</Typography>
                </Grid>
                <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">系统架构</Typography>
                    <Typography variant="body2">{node.arch || "-"}</Typography>
                </Grid>
                <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">CPU 核心数</Typography>
                    <Typography variant="body2">{node.cpu_cores > 0 ? `${node.cpu_cores} 核` : "-"}</Typography>
                </Grid>
                <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">总内存</Typography>
                    <Typography variant="body2">{formatBytes(node.memory_total)}</Typography>
                </Grid>
                <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">Go 版本</Typography>
                    <Typography variant="body2">{node.go_version || "-"}</Typography>
                </Grid>
                <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">Agent 版本</Typography>
                    <Typography variant="body2">{node.agent_version || "-"}</Typography>
                </Grid>
                <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">最后心跳</Typography>
                    <Typography variant="body2">{node.last_ping_at || "-"}</Typography>
                </Grid>
                <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">节点地址</Typography>
                    <Typography variant="body2" sx={{fontFamily: "monospace"}}>{node.address || "-"}</Typography>
                </Grid>
                <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">区域</Typography>
                    <Typography variant="body2">{node.region || "-"}</Typography>
                </Grid>
                <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">备注</Typography>
                    <Typography variant="body2">{node.remark || "-"}</Typography>
                </Grid>
            </Grid>
        </Box>
    );
};

// Add Node Dialog
const NodeAdd = forwardRef((props, ref) => {
    const {refreshNodeList} = props;
    const {enqueueSnackbar} = useSnackbar();
    useImperativeHandle(ref, () => ({handleClickOpen}));
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [region, setRegion] = useState("");
    const [address, setAddress] = useState("");
    const [remark, setRemark] = useState("");

    const handleClickOpen = () => {
        setName("");
        setRegion("");
        setAddress("");
        setRemark("");
        setOpen(true);
    };
    const handleClose = () => setOpen(false);
    const handleSubmit = () => {
        if (!name.trim()) {
            enqueueSnackbar("节点名称不能为空", {variant: "error"});
            return;
        }
        if (!address.trim()) {
            enqueueSnackbar("节点地址不能为空", {variant: "error"});
            return;
        }
        httpRequest.post("/node", {name, region, address, remark})
            .then(res => {
                if (res.code !== 0) {
                    enqueueSnackbar(res.message, {variant: "error"});
                    return;
                }
                enqueueSnackbar("添加成功", {variant: "success"});
                refreshNodeList();
                handleClose();
            })
            .catch(() => enqueueSnackbar("添加失败", {variant: "error"}));
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>添加边缘节点</DialogTitle>
            <DialogContent>
                <TextField autoFocus margin="dense" label="节点名称" fullWidth variant="standard"
                           value={name} onChange={e => setName(e.target.value)} required/>
                <TextField margin="dense" label="区域 (例如: 香港, 新加坡)" fullWidth variant="standard"
                           value={region} onChange={e => setRegion(e.target.value)}/>
                <TextField margin="dense" label="节点地址 (例如: http://192.168.1.100:8899)" fullWidth variant="standard"
                           value={address} onChange={e => setAddress(e.target.value)} required/>
                <TextField margin="dense" label="备注" fullWidth variant="standard" multiline rows={2}
                           value={remark} onChange={e => setRemark(e.target.value)}/>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>取消</Button>
                <Button onClick={handleSubmit} variant="contained">添加</Button>
            </DialogActions>
        </Dialog>
    );
});

// Edit Node Dialog
const NodeEdit = forwardRef((props, ref) => {
    const {nodeInfo, refreshNodeList} = props;
    const {enqueueSnackbar} = useSnackbar();
    useImperativeHandle(ref, () => ({handleClickOpen}));
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [region, setRegion] = useState("");
    const [address, setAddress] = useState("");
    const [remark, setRemark] = useState("");

    const handleClickOpen = () => {
        setName(nodeInfo.name || "");
        setRegion(nodeInfo.region || "");
        setAddress(nodeInfo.address || "");
        setRemark(nodeInfo.remark || "");
        setOpen(true);
    };
    const handleClose = () => setOpen(false);
    const handleSubmit = () => {
        if (!name.trim()) {
            enqueueSnackbar("节点名称不能为空", {variant: "error"});
            return;
        }
        if (!address.trim()) {
            enqueueSnackbar("节点地址不能为空", {variant: "error"});
            return;
        }
        httpRequest.put(`/node/${nodeInfo.id}`, {name, region, address, remark})
            .then(res => {
                if (res.code !== 0) {
                    enqueueSnackbar(res.message, {variant: "error"});
                    return;
                }
                enqueueSnackbar("修改成功", {variant: "success"});
                refreshNodeList();
                handleClose();
            })
            .catch(() => enqueueSnackbar("修改失败", {variant: "error"}));
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>编辑边缘节点</DialogTitle>
            <DialogContent>
                <TextField autoFocus margin="dense" label="节点名称" fullWidth variant="standard"
                           value={name} onChange={e => setName(e.target.value)} required/>
                <TextField margin="dense" label="区域 (例如: 香港, 新加坡)" fullWidth variant="standard"
                           value={region} onChange={e => setRegion(e.target.value)}/>
                <TextField margin="dense" label="节点地址 (例如: http://192.168.1.100:8899)" fullWidth variant="standard"
                           value={address} onChange={e => setAddress(e.target.value)} required/>
                <TextField margin="dense" label="备注" fullWidth variant="standard" multiline rows={2}
                           value={remark} onChange={e => setRemark(e.target.value)}/>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>取消</Button>
                <Button onClick={handleSubmit} variant="contained">保存</Button>
            </DialogActions>
        </Dialog>
    );
});

// Deploy Node Dialog - SSH deploy to existing node
const NodeDeployDialog = forwardRef((props, ref) => {
    const {refreshNodeList} = props;
    const {enqueueSnackbar} = useSnackbar();
    useImperativeHandle(ref, () => ({handleClickOpen}));
    const [open, setOpen] = useState(false);
    const [nodeInfo, setNodeInfo] = useState({});
    const [sshHost, setSSHHost] = useState("");
    const [sshPort, setSSHPort] = useState("22");
    const [sshUser, setSSHUser] = useState("root");
    const [sshPass, setSSHPass] = useState("");
    const [installPath, setInstallPath] = useState("/opt/gonitor");
    const [deploying, setDeploying] = useState(false);
    const [testing, setTesting] = useState(false);
    const [deployLog, setDeployLog] = useState("");
    const [sysInfo, setSysInfo] = useState(null);

    const handleClickOpen = (info) => {
        setNodeInfo(info);
        setSSHHost(info.ip || info.address?.replace(/https?:\/\//, "").split(":")[0] || "");
        setSSHPort("22");
        setSSHUser("root");
        setSSHPass("");
        setInstallPath("/opt/gonitor");
        setDeploying(false);
        setDeployLog("");
        setSysInfo(null);
        setOpen(true);
    };
    const handleClose = () => {
        if (!deploying) setOpen(false);
    };

    const handleTestConnection = () => {
        if (!sshHost || !sshUser || !sshPass) {
            enqueueSnackbar("请填写SSH连接信息", {variant: "error"});
            return;
        }
        setTesting(true);
        setSysInfo(null);
        httpRequest.post("/node/deploy/test", {
            ssh_host: sshHost,
            ssh_port: parseInt(sshPort) || 22,
            ssh_user: sshUser,
            ssh_password: sshPass,
        }).then(res => {
            if (res.code !== 0) {
                enqueueSnackbar("连接失败: " + res.message, {variant: "error"});
            } else {
                enqueueSnackbar("SSH连接成功", {variant: "success"});
                if (res.data?.sys_info) {
                    setSysInfo(res.data.sys_info);
                }
            }
        }).catch(() => {
            enqueueSnackbar("连接测试失败", {variant: "error"});
        }).finally(() => setTesting(false));
    };

    const handleDeploy = () => {
        if (!sshHost || !sshUser || !sshPass) {
            enqueueSnackbar("请填写SSH连接信息", {variant: "error"});
            return;
        }
        setDeploying(true);
        setDeployLog("正在连接并部署...\n");
        httpRequest.post("/node/deploy", {
            node_id: nodeInfo.id,
            ssh_host: sshHost,
            ssh_port: parseInt(sshPort) || 22,
            ssh_user: sshUser,
            ssh_password: sshPass,
            install_path: installPath,
        }).then(res => {
            if (res.code !== 0) {
                enqueueSnackbar("部署失败: " + res.message, {variant: "error"});
                setDeployLog(prev => prev + "\n部署失败: " + res.message);
            } else {
                enqueueSnackbar("部署成功", {variant: "success"});
                setDeployLog(res.data?.deploy_log || "部署完成");
                if (res.data?.sys_info) {
                    setSysInfo(res.data.sys_info);
                }
                refreshNodeList();
            }
        }).catch(err => {
            enqueueSnackbar("部署请求失败", {variant: "error"});
            setDeployLog(prev => prev + "\n请求失败: " + err.message);
        }).finally(() => setDeploying(false));
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>SSH 部署 - {nodeInfo.name}</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
                    通过SSH连接到远程服务器，自动部署Gonitor边缘节点Agent
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <TextField margin="dense" label="SSH 主机地址" fullWidth variant="outlined" size="small"
                                   value={sshHost} onChange={e => setSSHHost(e.target.value)} required/>
                    </Grid>
                    <Grid item xs={6}>
                        <TextField margin="dense" label="SSH 端口" fullWidth variant="outlined" size="small"
                                   value={sshPort} onChange={e => setSSHPort(e.target.value)} type="number"/>
                    </Grid>
                    <Grid item xs={6}>
                        <TextField margin="dense" label="SSH 用户名" fullWidth variant="outlined" size="small"
                                   value={sshUser} onChange={e => setSSHUser(e.target.value)} required/>
                    </Grid>
                    <Grid item xs={6}>
                        <TextField margin="dense" label="SSH 密码" fullWidth variant="outlined" size="small"
                                   type="password" value={sshPass} onChange={e => setSSHPass(e.target.value)}
                                   required/>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField margin="dense" label="安装路径" fullWidth variant="outlined" size="small"
                                   value={installPath} onChange={e => setInstallPath(e.target.value)}
                                   helperText="远程服务器上的Gonitor安装目录"/>
                    </Grid>
                </Grid>

                {sysInfo && (
                    <Box sx={{mt: 2, p: 1.5, bgcolor: "grey.50", borderRadius: 1}}>
                        <Typography variant="subtitle2" gutterBottom>远程系统信息</Typography>
                        <Grid container spacing={1}>
                            {Object.entries(sysInfo).map(([key, value]) => (
                                <Grid item xs={4} key={key}>
                                    <Typography variant="caption" color="text.secondary">{key}</Typography>
                                    <Typography variant="body2"
                                                sx={{fontFamily: "monospace", fontSize: 12}}>{value || "-"}</Typography>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}

                {deploying && <LinearProgress sx={{mt: 2}}/>}

                {deployLog && (
                    <Box sx={{
                        mt: 2,
                        p: 1.5,
                        bgcolor: "#1e1e1e",
                        color: "#d4d4d4",
                        borderRadius: 1,
                        fontFamily: "monospace",
                        fontSize: 12,
                        maxHeight: 300,
                        overflow: "auto",
                        whiteSpace: "pre-wrap"
                    }}>
                        {deployLog}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={deploying}>取消</Button>
                <LoadingButton loading={testing} onClick={handleTestConnection} variant="outlined"
                               disabled={deploying}>
                    测试连接
                </LoadingButton>
                <LoadingButton loading={deploying} onClick={handleDeploy} variant="contained"
                               startIcon={<CloudUploadIcon/>}>
                    开始部署
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
});

// Deploy New Node Dialog - create + deploy in one step
const NodeDeployNewDialog = forwardRef((props, ref) => {
    const {refreshNodeList} = props;
    const {enqueueSnackbar} = useSnackbar();
    useImperativeHandle(ref, () => ({handleClickOpen}));
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [region, setRegion] = useState("");
    const [remark, setRemark] = useState("");
    const [sshHost, setSSHHost] = useState("");
    const [sshPort, setSSHPort] = useState("22");
    const [sshUser, setSSHUser] = useState("root");
    const [sshPass, setSSHPass] = useState("");
    const [installPath, setInstallPath] = useState("/opt/gonitor");
    const [deploying, setDeploying] = useState(false);
    const [testing, setTesting] = useState(false);
    const [deployLog, setDeployLog] = useState("");
    const [sysInfo, setSysInfo] = useState(null);

    const handleClickOpen = () => {
        setName("");
        setRegion("");
        setRemark("");
        setSSHHost("");
        setSSHPort("22");
        setSSHUser("root");
        setSSHPass("");
        setInstallPath("/opt/gonitor");
        setDeploying(false);
        setDeployLog("");
        setSysInfo(null);
        setOpen(true);
    };
    const handleClose = () => {
        if (!deploying) setOpen(false);
    };

    const handleTestConnection = () => {
        if (!sshHost || !sshUser || !sshPass) {
            enqueueSnackbar("请填写SSH连接信息", {variant: "error"});
            return;
        }
        setTesting(true);
        setSysInfo(null);
        httpRequest.post("/node/deploy/test", {
            ssh_host: sshHost,
            ssh_port: parseInt(sshPort) || 22,
            ssh_user: sshUser,
            ssh_password: sshPass,
        }).then(res => {
            if (res.code !== 0) {
                enqueueSnackbar("连接失败: " + res.message, {variant: "error"});
            } else {
                enqueueSnackbar("SSH连接成功", {variant: "success"});
                if (res.data?.sys_info) {
                    setSysInfo(res.data.sys_info);
                }
            }
        }).catch(() => {
            enqueueSnackbar("连接测试失败", {variant: "error"});
        }).finally(() => setTesting(false));
    };

    const handleDeploy = () => {
        if (!name.trim()) {
            enqueueSnackbar("请填写节点名称", {variant: "error"});
            return;
        }
        if (!sshHost || !sshUser || !sshPass) {
            enqueueSnackbar("请填写SSH连接信息", {variant: "error"});
            return;
        }
        setDeploying(true);
        setDeployLog("正在创建节点并部署...\n");
        httpRequest.post("/node/deploy/new", {
            name,
            region,
            remark,
            ssh_host: sshHost,
            ssh_port: parseInt(sshPort) || 22,
            ssh_user: sshUser,
            ssh_password: sshPass,
            install_path: installPath,
        }).then(res => {
            if (res.code !== 0) {
                enqueueSnackbar("部署失败: " + res.message, {variant: "error"});
                setDeployLog(prev => prev + "\n部署失败: " + res.message);
            } else {
                enqueueSnackbar("节点创建并部署成功", {variant: "success"});
                setDeployLog(res.data?.deploy_log || "部署完成");
                if (res.data?.sys_info) {
                    setSysInfo(res.data.sys_info);
                }
                refreshNodeList();
            }
        }).catch(err => {
            enqueueSnackbar("部署请求失败", {variant: "error"});
            setDeployLog(prev => prev + "\n请求失败: " + err.message);
        }).finally(() => setDeploying(false));
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>一键部署新边缘节点</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
                    输入节点信息和SSH凭据，自动创建节点并通过SSH部署Gonitor Agent
                </Typography>

                <Typography variant="subtitle2" sx={{mt: 1, mb: 0.5}}>节点信息</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={4}>
                        <TextField margin="dense" label="节点名称" fullWidth variant="outlined" size="small"
                                   value={name} onChange={e => setName(e.target.value)} required/>
                    </Grid>
                    <Grid item xs={4}>
                        <TextField margin="dense" label="区域" fullWidth variant="outlined" size="small"
                                   value={region} onChange={e => setRegion(e.target.value)}
                                   placeholder="例如: 香港, 新加坡"/>
                    </Grid>
                    <Grid item xs={4}>
                        <TextField margin="dense" label="备注" fullWidth variant="outlined" size="small"
                                   value={remark} onChange={e => setRemark(e.target.value)}/>
                    </Grid>
                </Grid>

                <Typography variant="subtitle2" sx={{mt: 2, mb: 0.5}}>SSH 连接信息</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <TextField margin="dense" label="SSH 主机地址" fullWidth variant="outlined" size="small"
                                   value={sshHost} onChange={e => setSSHHost(e.target.value)} required/>
                    </Grid>
                    <Grid item xs={6}>
                        <TextField margin="dense" label="SSH 端口" fullWidth variant="outlined" size="small"
                                   value={sshPort} onChange={e => setSSHPort(e.target.value)} type="number"/>
                    </Grid>
                    <Grid item xs={6}>
                        <TextField margin="dense" label="SSH 用户名" fullWidth variant="outlined" size="small"
                                   value={sshUser} onChange={e => setSSHUser(e.target.value)} required/>
                    </Grid>
                    <Grid item xs={6}>
                        <TextField margin="dense" label="SSH 密码" fullWidth variant="outlined" size="small"
                                   type="password" value={sshPass} onChange={e => setSSHPass(e.target.value)}
                                   required/>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField margin="dense" label="安装路径" fullWidth variant="outlined" size="small"
                                   value={installPath} onChange={e => setInstallPath(e.target.value)}
                                   helperText="远程服务器上的Gonitor安装目录"/>
                    </Grid>
                </Grid>

                {sysInfo && (
                    <Box sx={{mt: 2, p: 1.5, bgcolor: "grey.50", borderRadius: 1}}>
                        <Typography variant="subtitle2" gutterBottom>远程系统信息</Typography>
                        <Grid container spacing={1}>
                            {Object.entries(sysInfo).map(([key, value]) => (
                                <Grid item xs={4} key={key}>
                                    <Typography variant="caption" color="text.secondary">{key}</Typography>
                                    <Typography variant="body2"
                                                sx={{fontFamily: "monospace", fontSize: 12}}>{value || "-"}</Typography>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}

                {deploying && <LinearProgress sx={{mt: 2}}/>}

                {deployLog && (
                    <Box sx={{
                        mt: 2,
                        p: 1.5,
                        bgcolor: "#1e1e1e",
                        color: "#d4d4d4",
                        borderRadius: 1,
                        fontFamily: "monospace",
                        fontSize: 12,
                        maxHeight: 300,
                        overflow: "auto",
                        whiteSpace: "pre-wrap"
                    }}>
                        {deployLog}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={deploying}>取消</Button>
                <LoadingButton loading={testing} onClick={handleTestConnection} variant="outlined"
                               disabled={deploying}>
                    测试连接
                </LoadingButton>
                <LoadingButton loading={deploying} onClick={handleDeploy} variant="contained"
                               startIcon={<RocketLaunchIcon/>}>
                    创建并部署
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
});

// Delete Confirm Dialog
const DeleteConfirmDialog = forwardRef((props, ref) => {
    const {refreshNodeList} = props;
    const {enqueueSnackbar} = useSnackbar();
    useImperativeHandle(ref, () => ({handleClickOpen}));
    const [open, setOpen] = useState(false);
    const [nodeInfo, setNodeInfo] = useState({});

    const handleClickOpen = (info) => {
        setNodeInfo(info);
        setOpen(true);
    };
    const handleClose = () => setOpen(false);
    const handleDelete = () => {
        httpRequest.delete(`/node/${nodeInfo.id}`)
            .then(res => {
                if (res.code === 0) {
                    enqueueSnackbar("删除成功", {variant: "success"});
                    refreshNodeList();
                } else {
                    enqueueSnackbar(res.message, {variant: "error"});
                }
            })
            .catch(err => enqueueSnackbar(err.message, {variant: "error"}))
            .finally(() => handleClose());
    };

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>删除节点</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    确定要删除节点 "{nodeInfo.name}" 吗？删除前请确保没有任务分配到此节点。
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>取消</Button>
                <Button onClick={handleDelete} color="error">删除</Button>
            </DialogActions>
        </Dialog>
    );
});
