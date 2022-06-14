
import * as React from "react";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Avatar from "@mui/material/Avatar";
export const UserRow = (props) => {
    const {userInfo, index} = props;
    return (
        <React.Fragment>
            <TableRow
                key={userInfo.id}
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
                <TableCell>{userInfo.create_time}</TableCell>
                <TableCell align="right"></TableCell>
            </TableRow>
        </React.Fragment>
    )
}