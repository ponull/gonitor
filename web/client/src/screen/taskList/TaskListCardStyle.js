import * as React from "react";
import {Card, CardContent, Chip} from "@mui/material";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import {InfoItem} from "./InfoItem";
import TaskActionContainer from "./TaskActionContainer";
import {PriorityEnum} from "../../enum/task";

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
                <Grid container spacing={2}>
                    <Grid item xs={8}>
                        <Box sx={{display: "flex", alignItems: "center", gap: 1}}>
                            <Typography sx={{textAlign:"left", fontWeight: 500}}>{taskInfo.name}</Typography>
                            <Chip
                                label={PriorityEnum.getLabel(taskInfo.priority)}
                                color={PriorityEnum.getColor(taskInfo.priority)}
                                size="small"
                            />
                            <Chip
                                label={taskInfo.is_disable ? "Disabled" : "Enabled"}
                                color={taskInfo.is_disable ? "default" : "success"}
                                size="small"
                                variant="outlined"
                            />
                        </Box>
                        {taskInfo.description && (
                            <Typography variant="body2" color="text.secondary" sx={{textAlign:"left", mt: 0.5}}>
                                {taskInfo.description}
                            </Typography>
                        )}
                    </Grid>
                    <Grid item xs={4}>
                        <TaskActionContainer selfTaskInfo={taskInfo} showEditDialog={showEditDialog}
                                             showConfirmDeleteDialog={showConfirmDeleteDialog}/>
                    </Grid>
                </Grid>
                <Grid container>
                            <InfoItem title="schedule" value={taskInfo.schedule}/>
                            <InfoItem title="command" value={taskInfo.command}/>
                            <InfoItem title="exec_type" value={taskInfo.exec_type}/>
                            <InfoItem title="running_count" value={taskInfo.running_count}/>
                            <InfoItem title="last_run_time" value={taskInfo.last_run_time}/>
                            <InfoItem title="next_run_time" value={taskInfo.next_run_time}/>
                            {taskInfo.tags && (
                                <InfoItem title="tags" value={
                                    <Box sx={{display: "flex", flexWrap: "wrap", gap: 0.5}}>
                                        {taskInfo.tags.split(",").filter(t => t.trim()).map(tag => (
                                            <Chip key={tag} label={tag.trim()} size="small" variant="outlined"/>
                                        ))}
                                    </Box>
                                }/>
                            )}
                </Grid>
            </CardContent>
        </Card>
    )
}