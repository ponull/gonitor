import * as React from "react";
import {forwardRef, useEffect, useImperativeHandle, useRef, useState} from "react";
import Box from "@mui/material/Box";
import LoadingButton from "@mui/lab/LoadingButton";
import {Refresh as RefreshIcon} from "@mui/icons-material";
import {
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
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

export const NodeList = () => {
    const [nodeList, setNodeList] = useState([]);
    const nodeAddRef = useRef(null);
    const nodeEditRef = useRef(null);
    const nodeDeleteConfirmRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [refreshLoading, setRefreshLoading] = useState(false);
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

    return (
        <Box sx={{m: 2}}>
            <NodeAdd ref={nodeAddRef} refreshNodeList={refreshNodeList}/>
            <NodeEdit ref={nodeEditRef} refreshNodeList={refreshNodeList} nodeInfo={nodeEditInfo}/>
            <DeleteConfirmDialog ref={nodeDeleteConfirmRef} refreshNodeList={refreshNodeList}/>
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
                <Button variant="contained" startIcon={<AddIcon/>} onClick={showCreateDialog}>
                    添加节点
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table sx={{minWidth: 650}} aria-label="node table">
                    <TableHead>
                        <TableRow>
                            <TableCell>No.</TableCell>
                            <TableCell>节点名称</TableCell>
                            <TableCell>区域</TableCell>
                            <TableCell>地址</TableCell>
                            <TableCell align="center">状态</TableCell>
                            <TableCell align="center">类型</TableCell>
                            <TableCell>密钥</TableCell>
                            <TableCell>备注</TableCell>
                            <TableCell align="right">操作</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ?
                            new Array(3).fill(0).map((_, rowIdx) => (
                                <TableRow key={"row" + rowIdx}>
                                    {new Array(9).fill(0).map((_, cellIdx) => (
                                        <TableCell key={"row" + rowIdx + "cell" + cellIdx}>
                                            <Skeleton variant="text"/>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                            : nodeList && nodeList.map((node, inx) => (
                            <TableRow key={node.id}>
                                <TableCell>{inx + 1}</TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={500}>{node.name}</Typography>
                                </TableCell>
                                <TableCell>{node.region}</TableCell>
                                <TableCell>
                                    <Typography variant="body2" sx={{fontFamily: "monospace"}}>
                                        {node.is_master ? "-" : node.address}
                                    </Typography>
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
                                    {!node.is_master && node.secret_key ? (
                                        <Box sx={{display: "flex", alignItems: "center", gap: 0.5}}>
                                            <Typography variant="body2" sx={{fontFamily: "monospace", fontSize: 12}}>
                                                {node.secret_key.substring(0, 8)}...
                                            </Typography>
                                            <Tooltip title="复制密钥">
                                                <IconButton size="small" onClick={() => copyToClipboard(node.secret_key)}>
                                                    <ContentCopyIcon fontSize="small"/>
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    ) : "-"}
                                </TableCell>
                                <TableCell>{node.remark || "-"}</TableCell>
                                <TableCell align="right">
                                    {!node.is_master && (
                                        <Box sx={{display: "flex", justifyContent: "flex-end", gap: 0.5}}>
                                            <Tooltip title="编辑">
                                                <IconButton size="small" onClick={() => showEditDialog(node)}>
                                                    <EditIcon fontSize="small"/>
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="重新生成密钥">
                                                <IconButton size="small" onClick={() => handleRegenerateKey(node.id)}>
                                                    <VpnKeyIcon fontSize="small"/>
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="删除">
                                                <IconButton size="small" color="error" onClick={() => showDeleteDialog(node)}>
                                                    <DeleteIcon fontSize="small"/>
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                        }
                    </TableBody>
                </Table>
            </TableContainer>
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
