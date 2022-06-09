import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Title from './Title';

export default function Users() {
    const userList = [
        {
            id:1,
            user: "root",
            terminal: "xshell",
            host: "20.1.3.23",
            start: "2019-03-16 15:00:00",
        },
        {
            id:2,
            user: "chy",
            terminal: "ftp",
            host: "20.1.3.23",
            start: "2019-03-16 15:00:00",
        },
    ];
    // const [userList, setUserList] = React.useState([]);
    // setUserList([
    //     {
    //         id:1,
    //         user: "root",
    //         terminal: "xshell",
    //         host: "20.1.3.23",
    //         start: "2019-03-16 15:00:00",
    //     },
    //     {
    //         id:2,
    //         user: "chy",
    //         terminal: "ftp",
    //         host: "20.1.3.23",
    //         start: "2019-03-16 15:00:00",
    //     },
    // ])
    return (
        <React.Fragment>
            <Title>Real Time Users(coming soon)</Title>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>No.</TableCell>
                        <TableCell>User</TableCell>
                        <TableCell>Terminal</TableCell>
                        <TableCell>Host</TableCell>
                        <TableCell>Started</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {userList.map((user, idx) => (
                        <TableRow key={user.id}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>{user.user}</TableCell>
                            <TableCell>{user.terminal}</TableCell>
                            <TableCell>{user.host}</TableCell>
                            <TableCell>{user.start}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </React.Fragment>
    );
}