import * as React from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Slide from '@mui/material/Slide';
import {forwardRef, useImperativeHandle, useRef} from "react";
import Container from "@mui/material/Container";
import httpRequest from "../../common/request/HttpRequest";
import {TaskInfoEditForm} from "./TaskInfoEditForm";
import {useSnackbar} from "notistack";

const Transition = forwardRef(function Transition(props, ref,) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export const TaskEdit = forwardRef((props, ref) => {
    const {taskInfo, refreshTaskList} = props;
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
    }
    const {enqueueSnackbar} = useSnackbar();
    const handleSubmit = () => {
        const formValue = formRef.current?.getFormValues()
        formValue.task_id = taskInfo.id;
        httpRequest.post("editTask", formValue)
            .then(res => {
                if (res.code !== 0){
                    enqueueSnackbar(res.message, {variant: "error"});
                    return;
                }
                refreshTaskList();
                enqueueSnackbar("修改成功", {variant: "success"});
                setOpen(false);
            })
            .catch(err => {
                enqueueSnackbar("操作失败", {variant: "error"});
            })
    }

    return (
        <Dialog
            fullScreen
            open={open}
            onClose={handleClose}
            TransitionComponent={Transition}
        >
            <AppBar sx={{position: 'relative'}}>
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
                        Edit Task
                    </Typography>
                    <Button autoFocus color="inherit" onClick={handleSubmit}>
                        save
                    </Button>
                </Toolbar>
            </AppBar>
            <Container maxWidth={"md"} sx={{mt:4}}>
                <TaskInfoEditForm ref={formRef} taskInfo={taskInfo}/>
            </Container>
        </Dialog>
    );
});

