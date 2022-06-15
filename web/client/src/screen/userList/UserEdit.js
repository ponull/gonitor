import {forwardRef} from "react";
import Dialog from "@mui/material/Dialog";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import * as React from "react";
import {useImperativeHandle, useRef} from "react";
import httpRequest from "../../common/request/HttpRequest";
import {useSnackbar} from "notistack";
import Slide from "@mui/material/Slide";
import {UserInfoEditForm} from "./UserInfoEditForm";



const Transition = forwardRef(function Transition(props, ref,) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export const UserEdit = forwardRef((props, ref) => {
    const {refreshUserList, userInfo} = props;
    useImperativeHandle(ref, () => ({
        handleClickOpen,
    }));
    const [open, setOpen] = React.useState(false);
    const formRef = useRef(null);
    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleSubmit = () => {
        const formValue = formRef.current?.getFormValues()
        httpRequest.put(`/user/${userInfo.id}`, formValue)
            .then(res => {
                if (res.code !== 0){
                    enqueueSnackbar(res.message, {variant: "error"});
                    return;
                }
                enqueueSnackbar("Edit Success", {variant: "success"});
                refreshUserList();
                setOpen(false);
            })
            .catch(err => {
                enqueueSnackbar("Edit Fail", {variant: "error"});
            })
    }

    const {enqueueSnackbar} = useSnackbar();
    return (
        <Dialog
            fullScreen
            open={open}
            onClose={handleClose}
            TransitionComponent={Transition}
        >
            <AppBar position="sticky">
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        onClick={handleClose}
                        aria-label="close"
                    >
                        <CloseIcon/>
                    </IconButton>
                    <Typography sx={{ml: 2, flex: 1}} variant="h6" component="div">
                        Edit User
                    </Typography>
                    <Button autoFocus color="inherit" onClick={handleSubmit}>
                        Save
                    </Button>
                </Toolbar>
            </AppBar>
            <Container maxWidth={"md"} sx={{mt:4}}>
                <UserInfoEditForm ref={formRef} userInfo={userInfo} isAdd={false}/>
            </Container>
        </Dialog>
    )
})