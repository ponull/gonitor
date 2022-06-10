import * as React from "react";
import {Card, CardActions, CardContent} from "@mui/material";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import {InfoItem} from "./InfoItem";
import TaskActionContainer from "./TaskActionContainer";

export const TaskListCardStyle = (props) => {
    const {loading, taskList, showConfirmDeleteDialog, showEditDialog} = props
    return (
        <React.Fragment>
            <Box>
                {loading ? ""
                    : taskList && taskList?.map((taskInfo, inx) => (
                    <TaskCard key={taskInfo.uniKey} taskInfo={taskInfo} index={inx}
                              showConfirmDeleteDialog={showConfirmDeleteDialog}
                              showEditDialog={showEditDialog}/>
                ))
                }
            </Box>
        </React.Fragment>
    )
}

const TaskCard = (props) => {
    const {taskInfo, showConfirmDeleteDialog, showEditDialog} = props
    return (
        <Card sx={{mt: 1}}>
            <CardContent>
                <Typography>{taskInfo.name}</Typography>
                <Grid container>
                    <Grid item xs={8}>
                        <Grid container>
                            <InfoItem title="schedule" value={taskInfo.schedule}/>
                            <InfoItem title="command" value={taskInfo.command}/>
                            <InfoItem title="exec_type" value={taskInfo.exec_type}/>
                            <InfoItem title="last_run_time" value={taskInfo.last_run_time}/>
                            <InfoItem title="next_run_time" value={taskInfo.next_run_time}/>
                        </Grid>
                    </Grid>
                    <Grid item xs={4}>
                        <TaskActionContainer selfTaskInfo={taskInfo} showEditDialog={showEditDialog}
                                             showConfirmDeleteDialog={showConfirmDeleteDialog}/>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    )
}