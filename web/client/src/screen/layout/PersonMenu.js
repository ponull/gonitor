import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import * as React from "react";
import {ListItem, Popover} from "@mui/material";
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import List from "@mui/material/List";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import httpRequest from "../../common/request/HttpRequest";
import {useSnackbar} from "notistack";

export const PersonMenu = () => {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const navigate = useNavigate();
    const loginOut = () => {
        navigate('/');
    }
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'person-popover' : undefined;
    const [userInfo, setUserInfo] = useState({
        username: "",
        avatar: "",
    })
    const {enqueueSnackbar} = useSnackbar();
    useEffect(()=>{
        httpRequest.get(`/user/selfInfo`)
            .then(res => {
                if(res.code !== 0){
                    enqueueSnackbar(res.message, {variant: "error"})
                    return;
                }
                setUserInfo(res.data)
            })
            .catch(err => {

            })
    },[])
    return (
        <React.Fragment>
            <IconButton aria-describedby={id} color="inherit" sx={{ml: 2}} onClick={handleClick}>
                <Avatar
                    alt={userInfo.username}
                    src={userInfo.avatar}
                    sx={{width: 40, height: 40}}
                />
            </IconButton>
            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
            >
                <List>
                    <ListItem button disabled>
                        <ListItemIcon>
                            <AccountCircleIcon/>
                        </ListItemIcon>
                        <ListItemText primary="Profile"/>
                    </ListItem>
                    <ListItem button disabled>
                        <ListItemIcon>
                            <SettingsIcon/>
                        </ListItemIcon>
                        <ListItemText primary="Settings"/>
                    </ListItem>
                    <ListItem button onClick={loginOut}>
                        <ListItemIcon>
                            <LogoutIcon/>
                        </ListItemIcon>
                        <ListItemText primary="Logout"/>
                    </ListItem>
                </List>
            </Popover>
        </React.Fragment>
    )
}