import CodeMirror from "@uiw/react-codemirror";
import {oneDark} from "@codemirror/theme-one-dark";
import {javascript} from "@codemirror/lang-javascript";
import * as React from "react";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import HelpIcon from "@mui/icons-material/Help";
import {Popover} from "@mui/material";
import Box from "@mui/material/Box";
import SyntaxHighlighter from "react-syntax-highlighter";
import {docco} from "react-syntax-highlighter/dist/cjs/styles/hljs";

export const AssertField = (props) => {
    const {assert, handleAssertChange} = props;
    return (
        <React.Fragment>
            <AssertLabel/>
            <CodeMirror
                value={assert}
                height="500px"
                theme={oneDark}
                extensions={[javascript({jsx: false, typescript: false})]}
                onChange={(value, viewUpdate) => {
                    handleAssertChange(value)
                    // console.log('value:', value);
                }}
            />
        </React.Fragment>
    )
}


const AssertLabel = () => {
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
            <Typography variant="p">
                Assert
                <IconButton
                    aria-owns={open ? 'mouse-over-popover' : undefined}
                    aria-haspopup="true"
                    onClick={handlePopoverOpen}
                    // onMouseEnter={handlePopoverOpen}
                    // onMouseLeave={handlePopoverClose}
                >
                    <HelpIcon/>
                </IconButton>
            </Typography>
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
                <Box sx={{ p: 1 ,whiteSpace: "pre-line"}}>
                    <p>Assert is a function that will be executed after the task is finished.</p>
                    <p>为空则不执行</p>
                    <p>方法中必须包含一个main方法，作为主方法，供给系统调用。</p>
                    <p>传入的参数为：output - type string 执行任务之后返回的字符串，无论是json还是html等 全部原样传入</p>
                    <p>返回结果为布尔类型, 返回true系统任务结束， 并记录状态为成功， 返回false会根据执行情况判断是否需要重试</p>
                    <p>其他功能性方法自行添加，比如：</p>

                    <SyntaxHighlighter language="javascript" style={docco}>
                        {`
function main(output) {
    let random = getRandomInt(0,1)
    if(random === 1){
        return true;
    }
    return false;
}
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //不含最大值，含最小值
}
`}
                    </SyntaxHighlighter>
                </Box>
            </Popover>
        </React.Fragment>
    );
}