import Dialog from "@mui/material/Dialog";
import {Button, DialogActions, DialogContent, DialogContentText, DialogTitle} from "@mui/material";
import * as React from "react";

export const TaskExecOutputDialog = (props) => {
    const {open, execOutput, closeDialog} = props
    return (
        <Dialog
            open={open}
            onClose={closeDialog}
            scroll="paper"
            aria-labelledby="scroll-dialog-title"
            aria-describedby="scroll-dialog-description"
        >
            <DialogTitle id="scroll-dialog-title">Exec Output</DialogTitle>
            <DialogContent dividers={true} sx={{width: 600}}>
                <DialogContentText
                    id="scroll-dialog-description"
                    tabIndex={-1}
                    sx={{whiteSpace: "pre-line"}}
                >
                    {execOutput}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={closeDialog}>Close</Button>
            </DialogActions>
        </Dialog>
    )
}