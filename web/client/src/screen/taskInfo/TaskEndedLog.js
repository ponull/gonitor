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
import moment from "moment";
import {useSnackbar} from "notistack";
import {MyTablePagination} from "../../components/MyTablePagination";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SmsFailedIcon from '@mui/icons-material/SmsFailed';
import * as Colors from "@mui/material/colors";


export const TaskEndedLog = (props) => {
    const {taskId} = props
    const [logList, setLogList] = React.useState([]);
    const [pageInfo, setPageInfo] = React.useState({
        page: 0,
        limit: 10,
        total_rows: 0
    });
    const handleChangePage = (page, limit) => {
        getLogList(page,limit)
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
                            <TableCell>Retry Times</TableCell>
                            <TableCell>Result</TableCell>
                            <TableCell align="right">Function</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {logList && logList.map((logInfo, index) => (
                            <TaskLogRow key={logInfo.id} logInfo={logInfo}/>
                        ))}
                    </TableBody>
                    <MyTablePagination pageInfo={pageInfo} onChangePage={handleChangePage}/>
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
                <TableCell>{logInfo.retry_times}</TableCell>
                <TableCell>{
                    logInfo.exec_result?<CheckCircleIcon color="success"/>:<SmsFailedIcon  sx={{ color: Colors.red[500] }}/>
                }</TableCell>
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