import * as React from 'react';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TaskIcon from '@mui/icons-material/Task';
import {Link as RouterLink,} from 'react-router-dom';
import {ListItem} from "@mui/material";
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import BookIcon from '@mui/icons-material/Book';

export const MainListItems = function () {
    return (
        <React.Fragment>
            <ListItemLink primary="控制台" to="/admin" icon={<DashboardIcon/>}/>
            <ListItemLink primary="任务列表" to="/admin/taskList" icon={<TaskIcon/>}/>
            <ListItemLink primary="用户列表" to="/admin/userList" icon={<SupervisorAccountIcon/>}/>
            <ListItemLink primary="操作日志" to="/admin/operationList" icon={<BookIcon/>}/>
        </React.Fragment>
    )
}

function ListItemLink(props) {
    const {icon, primary, to} = props;

    const renderLink = React.useMemo(
        () =>
            React.forwardRef(function Link(
                itemProps,
                ref,
            ) {
                return <RouterLink to={to} ref={ref} {...itemProps} role={undefined}/>;
            }),
        [to],
    );

    return (
        <ListItem button component={renderLink}>
            {icon ? <ListItemIcon>{icon}</ListItemIcon> : null}
            <ListItemText primary={primary}/>
        </ListItem>
    );
}