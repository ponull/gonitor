import TableContainer from "@mui/material/TableContainer";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import {Skeleton} from "@mui/material";
import {TaskRow} from "./TaskRow";
import * as React from "react";

export const TaskListTableStyle = (props) => {
    const {loading, taskList,showConfirmDeleteDialog,showEditDialog} = props
    return (
        <TableContainer component={Paper}>
            <Table sx={{minWidth: 650}} aria-label="simple table">
                <TableHead>
                    <TableRow>
                        <TableCell>No.</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell align="right">Type</TableCell>
                        <TableCell align="right">Schedule</TableCell>
                        <TableCell align="right">Strategy</TableCell>
                        <TableCell align="right">Disabled</TableCell>
                        <TableCell align="right">Running Count</TableCell>
                        <TableCell align="right">Last Run Time</TableCell>
                        <TableCell align="right">Next Run Time</TableCell>
                        <TableCell align="right">Function</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {loading ?
                        new Array(5).fill(0).map((_, rowIdx) => (
                            <TableRow key={"row" + rowIdx}>
                                {new Array(10).fill(0).map((_, cellIdx) => (
                                    <TableCell key={"row" + rowIdx + "cell" + cellIdx}>
                                        <Skeleton variant="text"/>
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                        : taskList && taskList?.map((taskInfo, inx) => (
                        <TaskRow key={taskInfo.uniKey} taskInfo={taskInfo} index={inx}
                                 showConfirmDeleteDialog={showConfirmDeleteDialog}
                                 showEditDialog={showEditDialog}/>
                    ))
                    }
                </TableBody>
            </Table>
        </TableContainer>
    )
}