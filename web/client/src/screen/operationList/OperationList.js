import {Skeleton, TableFooter, TablePagination, useTheme} from "@mui/material";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import LastPageIcon from "@mui/icons-material/LastPage";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import PropTypes from "prop-types";
import * as React from "react";
import TableContainer from "@mui/material/TableContainer";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import {useState} from "react";
import {useSnackbar} from "notistack";
import httpRequest from "../../common/request/HttpRequest";
import moment from "moment";
import {useEffect, useRef} from "react";

export const OperationList = ()=>{
    const [opList, setOpList] = useState([]);
    const [loading, setLoading] = useState(true)
    const {enqueueSnackbar} = useSnackbar();
    const getOpList = async (page, limit) => {
        const res = await httpRequest.get(`/op/list/${page + 1}/${limit}`);
        if (res.code !== 0){
            enqueueSnackbar(res.message, {variant: 'error'})
            return;
        }
        let data = res.data;
        const newOpList = data.list.map(opInfo => {
            return {
                ...opInfo,
                //这个作为key 是为了修改之后返回来就可以渲染，否则从新拿到的数据不渲染 不生成随机字符串是为了只渲染修改的那一条就可以了
                uniKey: opInfo.update_time + "_" + opInfo.id
            }
        })
        setOpList(newOpList)
        setPageInfo({
            page: data.page - 1,
            limit: data.limit,
            total_rows: data.total_rows
        })
    }

    const firstRenderRef = useRef(true);
    useEffect(() => {
        if (!firstRenderRef.current) {
            return;
        }
        firstRenderRef.current = false;
        getOpList(pageInfo.page, pageInfo.limit).then(() => {
            setLoading(false);
        });
    },[])
    const [pageInfo, setPageInfo] = React.useState({
        page: 0,
        limit: 10,
        total_rows: 0
    });
    const handleChangePage = (event, newPage) => {
        getOpList(newPage,pageInfo.limit)
        // setPageInfo({...pageInfo, page: newPage})
    };
    const handleChangePageSize = (event) => {
        console.log(event.target.value)
        // setPageInfo({...pageInfo, limit: event.target.value, page: 0})
        getOpList(pageInfo.page, event.target.value)
    };
    return (
        <Box sx={{m:2}}>
            <TableContainer component={Paper}>
                <Table sx={{minWidth: 650}} aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell>No.</TableCell>
                            <TableCell>Create Time</TableCell>
                            <TableCell>Operator Name</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell align="right">Remark</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ?
                            new Array(5).fill(0).map((_, rowIdx) => (
                                <TableRow key={"row" + rowIdx}>
                                    {new Array(5).fill(0).map((_, cellIdx) => (
                                        <TableCell key={"row" + rowIdx + "cell" + cellIdx}>
                                            <Skeleton variant="text"/>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                            : opList && opList?.map((opInfo, inx) => (
                            <TableRow key={opInfo.uniKey}>
                                <TableCell>{inx + 1}</TableCell>
                                <TableCell>{moment(opInfo.create_time).format("yyyy-MM-DD HH:mm:ss") }</TableCell>
                                <TableCell>{opInfo.username}</TableCell>
                                <TableCell>{opInfo.op_type}</TableCell>
                                <TableCell align="right" sx={{whiteSpace: "pre-line"}}>{opInfo.remark}</TableCell>
                            </TableRow>
                        ))
                        }
                    </TableBody>

                    <TableFooter>
                        <TableRow>
                            <TablePagination
                                rowsPerPageOptions={[10, 20, 50]}
                                colSpan={6}
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