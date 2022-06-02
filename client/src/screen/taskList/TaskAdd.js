import * as React from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Slide from '@mui/material/Slide';
import {TransitionProps} from '@mui/material/transitions';
import {forwardRef, useImperativeHandle, useRef} from "react";
import Container from "@mui/material/Container";
import httpRequest from "../../common/request/HttpRequest";
import {TaskInfoEditForm} from "./TaskInfoEditForm";
import {ExecuteTypeEnum} from "../../enum/task";

const Transition = forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export const TaskAdd = forwardRef((props, ref) => {
    const {refreshTaskList} = props;
    const taskInfo = {
        name: "",
        exec_type: ExecuteTypeEnum.HTTP,
        command:"",
        schedule:"",
        retry_times: 0,
        retry_interval: 3000,
        execute_strategy: 0,
        is_disable: false
    }
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
        httpRequest.post("addTask", formValue)
            .then(res => {
                refreshTaskList();
                setOpen(false);
            })
            .catch(err => {
                console.log(err)
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
                        Add Task
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

