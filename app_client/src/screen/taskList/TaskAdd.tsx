import * as React from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Slide from '@mui/material/Slide';
import {TransitionProps} from '@mui/material/transitions';
import {forwardRef, useImperativeHandle} from "react";
import Container from "@mui/material/Container";
import {FormControl, InputLabel, MenuItem, Select} from "@mui/material";
import {SelectChangeEvent} from "@mui/material/Select/SelectInput";

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});
export const TaskAdd = forwardRef((props: any, ref: any) => {
    useImperativeHandle(ref, () => ({
        handleClickOpen,
    }));
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

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
                    <Button autoFocus color="inherit" onClick={handleClose}>
                        save
                    </Button>
                </Toolbar>
            </AppBar>
            <Container maxWidth={"md"} sx={{mt:4}}>
                <TaskAddForm/>
            </Container>
        </Dialog>
    );
});

enum executeTypeEnum {
    HTTP = 'HTTP',
    CMD = 'CMD',
    FILE = 'FILE',
}

export const TaskAddForm = () => {
    const [executeType, setExecuteType] = React.useState('HTTP');
    const [commandName, setCommandName] = React.useState('Url');
    const handleChange = (event: SelectChangeEvent) => {
        const executeType = event.target.value;
        setExecuteType(executeType);
        switch (executeType) {
            case 'HTTP':
                setCommandName('Http Url (only support GET method)')
                break;
            case 'CMD':
                setCommandName('Bash Command')
                break;
            case 'FILE':
                setCommandName('File Path (Fullpath)')
                break;
        }
    };
    return (
        <React.Fragment>
            <Typography variant="h6" gutterBottom>
                Task Info
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <TextField
                        required
                        id="firstName"
                        name="firstName"
                        label="Name"
                        fullWidth
                        autoComplete="given-name"
                        variant="standard"
                    />
                </Grid>
                <Grid item xs={12}>
                    <FormControl variant="standard" sx={{minWidth: 120}}>
                        <InputLabel id="demo-simple-select-standard-label">Execute Type</InputLabel>
                        <Select
                            labelId="demo-simple-select-standard-label"
                            id="demo-simple-select-standard"
                            value={executeType}
                            onChange={handleChange}
                            label="Execute Type"
                        >
                            <MenuItem value="HTTP">Http</MenuItem>
                            <MenuItem value="CMD">Cmd</MenuItem>
                            <MenuItem value="FILE">File</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        required
                        id="address2"
                        name="address2"
                        label={commandName}
                        fullWidth
                        autoComplete="shipping address-line2"
                        variant="standard"
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        required
                        id="address1"
                        name="address1"
                        label="Schedule"
                        fullWidth
                        autoComplete="shipping address-line1"
                        variant="standard"
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        required
                        id="address1"
                        name="address1"
                        label="Retry Times"
                        fullWidth
                        autoComplete="shipping address-line1"
                        variant="standard"
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        required
                        id="address1"
                        name="address1"
                        label="Retry Interval"
                        fullWidth
                        autoComplete="shipping address-line1"
                        variant="standard"
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                    />
                </Grid>
                <Grid item xs={12}>
                    <FormControlLabel
                        control={<Checkbox name="saveAddress" value="yes"/>}
                        label="Singleton"
                    />
                </Grid>
                <Grid item xs={12}>
                    <FormControlLabel
                        control={<Checkbox name="saveAddress" value="yes"/>}
                        label="Disable"
                    />
                </Grid>
            </Grid>
        </React.Fragment>
    );
}