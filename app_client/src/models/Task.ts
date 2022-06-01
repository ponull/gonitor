export class TaskInfo {
    id: number = 0;
    name: string = "";
    execType: string = "";
    schedule: string = "";
    isSingleton: boolean = false;
    isDisable: boolean = false;
    runningCount: number = 0;
    lastRunTime: string = "";
    nextRunTime: string = "";
}

export class TaskLog {
    id: number = 0;
    task_id: number = 0;
    command: string = "";
    process_id: number = 0;
    execution_time: string = "";
    status: boolean = false;
    output: string = "";
}