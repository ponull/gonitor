import {Skeleton} from "@mui/material";
import Box from "@mui/material/Box";
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
import {MyTablePagination} from "../../components/MyTablePagination";

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
    const handleChangePage = (page, limit) => {
        getOpList(page, limit)
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
                    <MyTablePagination pageInfo={pageInfo} onChangePage={handleChangePage}/>
                </Table>
            </TableContainer>
        </Box>
    )
}