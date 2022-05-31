import * as React from "react";
import {useParams} from "react-router-dom";

export const TaskInfo = () => {
    const params = useParams()
    const taskId = params.taskId
    console.log(taskId);
    return (
        <React.Fragment>

            <div>111111</div>
            <div>{taskId}</div>
        </React.Fragment>
    )
}