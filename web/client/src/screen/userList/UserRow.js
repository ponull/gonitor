
import * as React from "react";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Avatar from "@mui/material/Avatar";
import moment from "moment";
import {ButtonGroup} from "@mui/material";
import Button from "@mui/material/Button";
export const UserRow = (props) => {
    const {userInfo, index, showConfirmDeleteDialog, showEditDialog} = props;
    return (
        <React.Fragment>
            <TableRow
                key={userInfo.uniKey}
                sx={{'&:last-child td, &:last-child th': {border: 0}}}
            >
                <TableCell component="th" scope="row">
                    {index + 1}
                </TableCell>
                <TableCell>
                    <Avatar alt={userInfo.username} src={userInfo.avatar} />
                </TableCell>
                <TableCell>{userInfo.username}</TableCell>
                <TableCell>{userInfo.login_account}</TableCell>
                <TableCell>{moment(userInfo.create_time).format("yyyy-MM-DD HH:mm:ss") }</TableCell>
                <TableCell align="right">
                    <ButtonGroup variant="outlined" aria-label="outlined button group" size="small">
                        <Button onClick={()=>{showEditDialog(userInfo)}}>Edit</Button>
                        <Button onClick={()=>{showConfirmDeleteDialog(userInfo)}}>Delete</Button>
                    </ButtonGroup>
                </TableCell>
            </TableRow>
        </React.Fragment>
    )
}