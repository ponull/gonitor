import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Container from "@mui/material/Container";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import {Button, ButtonGroup} from "@mui/material";

function createTask(
    name: string,
    type: string,
    schedule: string,
    singleton: boolean,
    disabled: boolean,
    lastRunTime: string,
) {
    return { name, type, schedule, singleton, disabled, lastRunTime };
}

const taskRows = [
    createTask("a28i赔率采集", "HTTP", "1 0 0 0 *", true, false, "2022-05-25 10:00:00"),
    createTask("a28i比赛状态更新", "HTTP", "1 0 0 0 *", true, false, "2022-05-25 10:00:00"),
    createTask("比赛结果通知", "HTTP", "1 0 0 0 *", true, false, "2022-05-25 10:00:00"),
];


export const TaskList = function (){
    return (
        <Container sx={{ mt: 4, mb: 4 }}>
            <TableContainer component={Paper} >
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell>No.</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell align="right">Type</TableCell>
                            <TableCell align="right">Schedule</TableCell>
                            <TableCell align="right">Singleton</TableCell>
                            <TableCell align="right">Disabled</TableCell>
                            <TableCell align="right">Last Run Time</TableCell>
                            <TableCell align="right">Function</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {taskRows.map((taskInfo, inx) => (
                            <TableRow
                                key={taskInfo.name}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell component="th" scope="row">
                                    {inx + 1}
                                </TableCell>
                                <TableCell>{taskInfo.name}</TableCell>
                                <TableCell align="right">{taskInfo.type}</TableCell>
                                <TableCell align="right">{taskInfo.schedule}</TableCell>
                                <TableCell align="right">{taskInfo.singleton?<CheckCircleOutlineIcon/>:""}</TableCell>
                                <TableCell align="right">{taskInfo.disabled?<CheckCircleOutlineIcon/>:""}</TableCell>
                                <TableCell align="right">{taskInfo.lastRunTime}</TableCell>
                                <TableCell align="right">
                                    <ButtonGroup variant="outlined" aria-label="outlined button group">
                                        <Button>Detail</Button>
                                        <Button>Edit</Button>
                                        <Button>Delete</Button>
                                    </ButtonGroup>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    )
}