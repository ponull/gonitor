import {useState} from "react";
import {SubscribeType, useSubscribe} from "../../common/socket/Websocket";
import * as React from "react";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import {StrategyEnum} from "../../enum/task";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import TaskActionContainer from "./TaskActionContainer"


export const TaskRow = (props) => {
    const {taskInfo, index, showConfirmDeleteDialog, showEditDialog} = props;
    const [selfTaskInfo, setSelfTaskInfo] = useState(taskInfo);
    useSubscribe(SubscribeType.TASK, taskInfo.id, (data) => {
        setSelfTaskInfo({
            ...selfTaskInfo,
            ...data
        })
    })

    return (
        <React.Fragment>
            <TableRow
                key={selfTaskInfo.id}
                sx={{'&:last-child td, &:last-child th': {border: 0}}}
            >
                <TableCell component="th" scope="row">
                    {index + 1}
                </TableCell>
                <TableCell>{selfTaskInfo.name}</TableCell>
                <TableCell align="right">{selfTaskInfo.exec_type}</TableCell>
                <TableCell align="right">{selfTaskInfo.schedule}</TableCell>
                <TableCell align="right">{StrategyEnum.getLanguage(selfTaskInfo.exec_strategy)}</TableCell>
                <TableCell align="right">{selfTaskInfo.is_disable ?
                    <CheckCircleOutlineIcon/> : ""}</TableCell>
                <TableCell align="right">{selfTaskInfo.running_count}</TableCell>
                <TableCell align="right">{selfTaskInfo.last_run_time}</TableCell>
                <TableCell align="right">{selfTaskInfo.next_run_time}</TableCell>
                <TableCell align="right">
                    <TaskActionContainer selfTaskInfo={selfTaskInfo} showEditDialog={showEditDialog}
                                         showConfirmDeleteDialog={showConfirmDeleteDialog}/>
                </TableCell>
            </TableRow>
            {/*<TaskLogContainer open={open} taskId={selfTaskInfo.id}/>*/}
        </React.Fragment>
    )
}

