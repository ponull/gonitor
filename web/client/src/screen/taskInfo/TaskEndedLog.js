import * as React from "react";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import {useEffect, useState} from "react";
import IconButton from "@mui/material/IconButton";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import {TaskExecOutputDialog} from "./TaskExecOutputDialog";
import httpRequest from "../../common/request/HttpRequest";
import TableContainer from "@mui/material/TableContainer";
import {TableFooter, TablePagination, useTheme} from "@mui/material";
// import TablePaginationActions from "@mui/material/TablePagination/TablePaginationActions";
import moment from "moment";

import FirstPageIcon from '@mui/icons-material/FirstPage';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import LastPageIcon from '@mui/icons-material/LastPage';
import Box from "@mui/material/Box";
import PropTypes from "prop-types";
import {useSnackbar} from "notistack";

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

export const TaskEndedLog = (props) => {
    const {taskId} = props
    const [logList, setLogList] = React.useState([]);
    const [pageInfo, setPageInfo] = React.useState({
        page: 0,
        limit: 10,
        total_rows: 0
    });
    const handleChangePage = (event, newPage) => {
        getLogList(newPage,pageInfo.limit)
    };
    const handleChangePageSize = (event) => {
        getLogList(pageInfo.page, event.target.value)
    };
    const {enqueueSnackbar} = useSnackbar();
    const getLogList = (page, limit) => {
        httpRequest.get(`/task/log/list/${taskId}/${page + 1}/${limit}`).then(res => {
            if (res.code !== 0){
                enqueueSnackbar(res.message, {variant: 'error'})
                return;
            }
            let data = res.data;
            setLogList(data.list)
            setPageInfo({
                page: data.page - 1,
                limit: data.limit,
                total_rows: data.total_rows
            })
        })
    }
    useEffect(() => {
        getLogList(pageInfo.page, pageInfo.limit)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return (
        <React.Fragment>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead >
                        <TableRow>
                            <TableCell>Time</TableCell>
                            <TableCell>Command</TableCell>
                            <TableCell align="right">Function</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {logList && logList.map((logInfo, index) => (
                            <TaskLogRow key={logInfo.id} logInfo={logInfo}/>
                        ))}
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

        </React.Fragment>
    )
}

const TaskLogRow = (props) => {
    const {logInfo} = props
    const [open, setOpen] = useState(false);
    const showExecOutput = () => {
        setExecOutput("正在加载...")
        setOpen(true)
        httpRequest.get(`/task/log/output/${logInfo.id}`).then(res => {
            setExecOutput(res.data)
        })
    }
    const [execOutput, setExecOutput] = useState("");
    return (
        <React.Fragment>
            <TableRow key={logInfo.id}>
                <TableCell component="th" scope="row">
                    {moment(logInfo.exec_time).format("yyyy-MM-DD HH:mm:ss") }
                </TableCell>
                <TableCell>{logInfo.command}</TableCell>
                <TableCell align="right">
                    <IconButton
                        size="small"
                        onClick={showExecOutput}
                    >
                        <FactCheckIcon/>
                    </IconButton>
                    <TaskExecOutputDialog open={open} execOutput={execOutput} closeDialog={() => {
                        setOpen(false)
                    }}/>
                </TableCell>
            </TableRow>
        </React.Fragment>
    )
}