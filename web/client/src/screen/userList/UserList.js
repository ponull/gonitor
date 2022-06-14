import {UserAdd} from "./UserAdd";
import {UserEdit} from "./UserEdit";
import Box from "@mui/material/Box";
import LoadingButton from "@mui/lab/LoadingButton";
import {Refresh as RefreshIcon} from "@mui/icons-material";
import {Button, Skeleton, TableFooter, TablePagination, useTheme} from "@mui/material";
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
import IconButton from "@mui/material/IconButton";
import LastPageIcon from "@mui/icons-material/LastPage";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import PropTypes from "prop-types";



function TablePaginationActions(props) {
    const theme = useTheme();
    const { count, page, rowsPerPage, onPageChange } = props;

    const handleFirstPageButtonClick = (event) => {
        onPageChange(event, 0);
    };

    const handleBackButtonClick = (event) => {
        onPageChange(event, page - 1);
    };

    const handleNextButtonClick = (event) => {
        onPageChange(event, page + 1);
    };

    const handleLastPageButtonClick = (event) => {
        onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
    };

    return (
        <Box sx={{ flexShrink: 0, ml: 2.5 }}>
            <IconButton
                onClick={handleFirstPageButtonClick}
                disabled={page === 0}
                aria-label="first page"
            >
                {theme.direction === 'rtl' ? <LastPageIcon /> : <FirstPageIcon />}
            </IconButton>
            <IconButton
                onClick={handleBackButtonClick}
                disabled={page === 0}
                aria-label="previous page"
            >
                {theme.direction === 'rtl' ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
            </IconButton>
            <IconButton
                onClick={handleNextButtonClick}
                disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                aria-label="next page"
            >
                {theme.direction === 'rtl' ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
            </IconButton>
            <IconButton
                onClick={handleLastPageButtonClick}
                disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                aria-label="last page"
            >
                {theme.direction === 'rtl' ? <FirstPageIcon /> : <LastPageIcon />}
            </IconButton>
        </Box>
    );
}

TablePaginationActions.propTypes = {
    count: PropTypes.number.isRequired,
    onPageChange: PropTypes.func.isRequired,
    page: PropTypes.number.isRequired,
    rowsPerPage: PropTypes.number.isRequired,
};

export const UserList = () => {
    const [userList, setUserList] = useState([]);
    const userAddRef = useRef(null);
    const userEditRef = useRef(null);
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

    }
    const showEditDialog = (userInfo) => {
        setUserEditInfo(userInfo);
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
    const handleChangePage = (event, newPage) => {
        getUserList(newPage,pageInfo.limit)
        // setPageInfo({...pageInfo, page: newPage})
    };
    const handleChangePageSize = (event) => {
        console.log(event.target.value)
        // setPageInfo({...pageInfo, limit: event.target.value, page: 0})
        getUserList(pageInfo.page, event.target.value)
    };
    return (
        <Box sx={{m: 2}}>
            <UserAdd ref={userAddRef} refreshUserList={refreshUserList}/>
            <UserEdit ref={userEditRef} refreshUserList={refreshUserList} userInfo={userEditInfo}/>
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

                    <TableFooter>
                        <TableRow>
                            <TablePagination
                                rowsPerPageOptions={[10, 20, 50]}
                                colSpan={3}
                                count={pageInfo.total_rows}
                                rowsPerPage={pageInfo.limit}
                                page={pageInfo.page}
                                SelectProps={{
                                    inputProps: {
                                        'aria-label': 'rows per page',
                                    },
                                    native: true,
                                }}
                                onPageChange={handleChangePage}
                                onRowsPerPageChange={handleChangePageSize}
                                ActionsComponent={TablePaginationActions}
                            />
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableContainer>
        </Box>
    )
}