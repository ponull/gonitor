import IconButton from "@mui/material/IconButton";
import LanguageIcon from "@mui/icons-material/Language";
import * as React from "react";
import {ListItem, Popover} from "@mui/material";
import List from "@mui/material/List";
import ListItemText from "@mui/material/ListItemText";

export const LanguageMenu = () => {
    const [anchorEl, setAnchorEl] = React.useState(null);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'language-popover' : undefined;
    return (
        <React.Fragment>
            <IconButton aria-describedby={id} color="inherit" onClick={handleClick}>
                <LanguageIcon/>
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
                        <ListItemText primary="简体中文"/>
                    </ListItem>
                    <ListItem button disabled>
                        <ListItemText primary="English"/>
                    </ListItem>
                </List>
            </Popover>
        </React.Fragment>
    )
}