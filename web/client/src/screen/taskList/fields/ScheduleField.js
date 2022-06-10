import * as React from "react";
import {FormControl, Input, InputAdornment, InputLabel, Popover} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import HelpIcon from "@mui/icons-material/Help";
import Box from "@mui/material/Box";

export const ScheduleField = (props) => {
    const {schedule, handleScheduleChange} = props



    const [anchorEl, setAnchorEl] = React.useState(null);

    const handlePopoverOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    return (
        <React.Fragment>
            <FormControl variant="standard">
                <InputLabel htmlFor="standard-adornment-schedule">Schedule</InputLabel>
                <Input
                    id="standard-adornment-schedule"
                    value={schedule}
                    onChange={handleScheduleChange}
                    endAdornment={
                        <InputAdornment position="end">
                            <IconButton
                                onClick={handlePopoverOpen}
                                edge="end"
                            >
                                <HelpIcon/>
                            </IconButton>
                        </InputAdornment>
                    }
                    label="Schedule"
                />
            </FormControl>
            {/*<TextField*/}
            {/*    required*/}
            {/*    id="schedule"*/}
            {/*    name="schedule"*/}
            {/*    label="Schedule"*/}
            {/*    value={schedule}*/}
            {/*    onChange={handleScheduleChange}*/}
            {/*    fullWidth*/}
            {/*    variant="standard"*/}
            {/*    endAdornment={*/}
            {/*        <InputAdornment position="end">*/}
            {/*            <IconButton*/}
            {/*                aria-label="toggle password visibility"*/}
            {/*                onClick={handlePopoverOpen}*/}
            {/*                edge="end"*/}
            {/*            >*/}
            {/*                <HelpIcon/>*/}
            {/*            </IconButton>*/}
            {/*        </InputAdornment>*/}
            {/*    }*/}
            {/*/>*/}
            <Popover
                id="mouse-over-popover"
                // sx={{
                //     pointerEvents: 'none',
                // }}
                open={open}
                anchorEl={anchorEl}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                onClose={handlePopoverClose}
                // disableRestoreFocus
            >
                <Box sx={{ p: 1}}>
                    <Typography variant="h6">时间格式</Typography>
                    <p>与Linux 中crontab命令相似，cron库支持用 5 个空格分隔的域来表示时间。这 5 个域含义依次为：</p>
                    <ul>
                        <li>Minutes：分钟，取值范围[0-59]，支持特殊字符* / , -；</li>
                        <li>Hours：小时，取值范围[0-23]，支持特殊字符* / , -；</li>
                        <li>Day of month：每月的第几天，取值范围[1-31]，支持特殊字符* / , - ?；</li>
                        <li>Month：月，取值范围[1-12]或者使用月份名字缩写[JAN-DEC]，支持特殊字符* / , -；</li>
                        <li>Day of week：周历，取值范围[0-6]或名字缩写[JUN-SAT]，支持特殊字符* / , - ?。</li>
                    </ul>
                    <p>注意，月份和周历名称都是不区分大小写的，也就是说SUN/Sun/sun表示同样的含义（都是周日）。</p>
                    <p>特殊字符含义如下:</p>
                    <ul>
                        <li>*：使用*的域可以匹配任何值，例如将月份域（第 4 个）设置为*，表示每个月；</li>
                        <li>/：用来指定范围的步长，例如将小时域（第 2 个）设置为3-59/15表示第 3 分钟触发，以后每隔 15 分钟触发一次，因此第 2 次触发为第 18 分钟，第 3 次为 33 分钟。。。直到分钟大于 59；</li>
                        <li>,：用来列举一些离散的值和多个范围，例如将周历的域（第 5 个）设置为MON,WED,FRI表示周一、三和五；</li>
                        <li>-：用来表示范围，例如将小时的域（第 1 个）设置为9-17表示上午 9 点到下午 17 点（包括 9 和 17）；</li>
                        <li>?：只能用在月历和周历的域中，用来代替*，表示每月/周的任意一天。</li>
                    </ul>
                    <p>了解规则之后，我们可以定义任意时间：</p>
                    <ul>
                        <li>30 * * * *：分钟域为 30，其他域都是*表示任意。每小时的 30 分触发；</li>
                        <li>30 3-6,20-23 * * *：分钟域为 30，小时域的3-6,20-23表示 3 点到 6 点和 20 点到 23 点。3,4,5,6,20,21,22,23 时的 30 分触发；</li>
                        <li>0 0 1 1 *：1（第 4 个） 月 1（第 3 个） 号的 0（第 2 个） 时 0（第 1 个） 分触发。</li>
                    </ul>
                    <p>预定义时间规则</p>
                    <p>为了方便使用，预定义了一些时间规则：</p>
                    <ul>
                        <li>@yearly：也可以写作@annually，表示每年第一天的 0 点。等价于0 0 1 1 *；</li>
                        <li>@monthly：表示每月第一天的 0 点。等价于0 0 1 * *；</li>
                        <li>@weekly：表示每周第一天的 0 点，注意第一天为周日，即周六结束，周日开始的那个 0 点。等价于0 0 * * 0；</li>
                        <li>@daily：也可以写作@midnight，表示每天 0 点。等价于0 0 * * *；</li>
                        <li>@hourly：表示每小时的开始。等价于0 * * * *。</li>
                    </ul>
                    <p>固定时间间隔</p>
                    <p>支持固定时间间隔，格式为: <code>@every {"<duration>"}</code></p>
                    <p>含义为每隔duration触发一次。{"<duration>"}例如1h30m10s。 <code>@every 1s</code> <code>@every 1m10s</code></p>
                </Box>
            </Popover>
        </React.Fragment>
    )
}