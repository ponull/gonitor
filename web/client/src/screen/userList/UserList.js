import {UserAdd} from "./UserAdd";
import {UserEdit} from "./UserEdit";
import Box from "@mui/material/Box";
import LoadingButton from "@mui/lab/LoadingButton";
import {Refresh as RefreshIcon} from "@mui/icons-material";
import {
    Button, DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Skeleton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import * as React from "react";
import {useRef, useState,useEffect} from "react";
import httpRequest from "../../common/request/HttpRequest";
import Paper from "@mui/material/Paper";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import Table from "@mui/material/Table";
import TableContainer from "@mui/material/TableContainer";
import {UserRow} from "./UserRow";
import {useSnackbar} from "notistack";
import {forwardRef, useImperativeHandle} from "react";
import Dialog from "@mui/material/Dialog";
import {MyTablePagination} from "../../components/MyTablePagination";

export const UserList = () => {
    const [userList, setUserList] = useState([]);
    const userAddRef = useRef(null);
    const userEditRef = useRef(null);
    const userDeleteConfirmDialogRef = useRef(null);
    const [loading, setLoading] = useState(true)
    const [refreshLoading, setRefreshLoading] = useState(false)
    const [userEditInfo, setUserEditInfo] = useState({
        id: 0,
        username: "",
        password: "",
        confirm_password: "",
        avatar: "",
    });
    const showCreateDialog = () => {
        userAddRef.current?.handleClickOpen();
    }
    const showConfirmDeleteDialog = (userInfo) => {
        userDeleteConfirmDialogRef.current.handleClickOpen(userInfo)
    }
    const showEditDialog = (userInfo) => {
        setUserEditInfo(userInfo);
        console.log(userInfo)
        userEditRef.current?.handleClickOpen();
    }
    const {enqueueSnackbar} = useSnackbar();
    const getUserList = async (page, limit) => {
        const res = await httpRequest.get(`/user/list/${page + 1}/${limit}`);
        if (res.code !== 0){
            enqueueSnackbar(res.message, {variant: 'error'})
            return;
        }
        let data = res.data;
        const newUserList = data.list.map(userInfo => {
            return {
                ...userInfo,
                //这个作为key 是为了修改之后返回来就可以渲染，否则从新拿到的数据不渲染 不生成随机字符串是为了只渲染修改的那一条就可以了
                uniKey: userInfo.update_time + "_" + userInfo.id
            }
        })
        setUserList(newUserList)
        setPageInfo({
            page: data.page - 1,
            limit: data.limit,
            total_rows: data.total_rows
        })
    }
    const refreshUserList = () => {
        setRefreshLoading(true);
        getUserList(pageInfo.page, pageInfo.limit).then(() => {
            setRefreshLoading(false);
        })
    }
    const firstRenderRef = useRef(true);
    useEffect(() => {
        if (!firstRenderRef.current) {
            return;
        }
        firstRenderRef.current = false;
        getUserList(pageInfo.page, pageInfo.limit).then(() => {
            setLoading(false);
        });
    },[])

    const [pageInfo, setPageInfo] = React.useState({
        page: 0,
        limit: 10,
        total_rows: 0
    });
    const handleChangePage = (page, limit) => {
        getUserList(page,limit)
    };
    return (
        <Box sx={{m: 2}}>
            <UserAdd ref={userAddRef} refreshUserList={refreshUserList}/>
            <UserEdit ref={userEditRef} refreshUserList={refreshUserList} userInfo={userEditInfo}/>
            <DeleteConfirmDialog ref={userDeleteConfirmDialogRef}/>
            <Box sx={{mb: 2, display: "flex", justifyContent: "flex-end",}}>
                <LoadingButton
                    loading={refreshLoading}
                    loadingPosition="start"
                    startIcon={<RefreshIcon/>}
                    variant="contained"
                    sx={{mr: 2}}
                    onClick={refreshUserList}
                >
                    Refresh
                </LoadingButton>
                <Button variant="contained" startIcon={<AddIcon/>} onClick={showCreateDialog}>
                    Add
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table sx={{minWidth: 650}} aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell>No.</TableCell>
                            <TableCell>Avatar</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Login Account</TableCell>
                            <TableCell>Create Time</TableCell>
                            <TableCell align="right">Function</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ?
                            new Array(5).fill(0).map((_, rowIdx) => (
                                <TableRow key={"row" + rowIdx}>
                                    {new Array(6).fill(0).map((_, cellIdx) => (
                                        <TableCell key={"row" + rowIdx + "cell" + cellIdx}>
                                            <Skeleton variant="text"/>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                            : userList && userList?.map((userInfo, inx) => (
                            <UserRow key={userInfo.uniKey} userInfo={userInfo} index={inx}
                                     showConfirmDeleteDialog={showConfirmDeleteDialog}
                                     showEditDialog={showEditDialog}/>
                        ))
                        }
                    </TableBody>
                    <MyTablePagination pageInfo={pageInfo} onChangePage={handleChangePage}/>
                </Table>
            </TableContainer>
        </Box>
    )
}

const DeleteConfirmDialog = forwardRef((props, ref) => {
    const {deleteUserById} = props
    useImperativeHandle(ref, () => ({
        handleClickOpen,
    }));
    const [open, setOpen] = useState(false);
    const [userInfo, setUserInfo] = useState({});
    const handleClickOpen = (userInfo) => {
        setUserInfo(userInfo);
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
    };
    const {enqueueSnackbar} = useSnackbar();
    const deleteUser = () => {
        httpRequest.delete(`/user/${userInfo.id}`)
            .then(res => {
                if (res.code === 0) {
                    deleteUserById(userInfo.id)
                    enqueueSnackbar("Delete Success", {variant: "success"});
                } else {
                    enqueueSnackbar(res.message, {variant: "error"});
                }
            })
            .catch(err => {
                enqueueSnackbar(err.message, {variant: "error"})
            })
            .finally(() => {
                handleClose()
            })
    }
    return (
        <React.Fragment>
            <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
                <DialogTitle id="form-dialog-title">Delete Task</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure to delete this task witch name {userInfo.username}?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={deleteUser} color="primary">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    )
})