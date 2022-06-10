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

export const ResultHandlerField = (props) => {
    const {resultHandler, handleResultHandlerChange} = props;
    return (
        <React.Fragment>

            <ResultHandlerLabel/>
            <CodeMirror
                value={resultHandler}
                height="500px"
                theme={oneDark}
                extensions={[javascript({jsx: false, typescript: false})]}
                onChange={(value, viewUpdate) => {
                    handleResultHandlerChange(value)
                    // console.log('value:', value);
                }}
            />
        </React.Fragment>
    )
}


const ResultHandlerLabel = () => {
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
                Result Handler
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
                <Box sx={{ p: 1}}>
                    <p>Result Handler is a function that will be executed after the task is finished.</p>
                    <p>为空则不执行</p>
                    <p>方法中必须包含一个main方法，作为主方法，供给系统调用。</p>
                    <p>传入的参数1为：result - type bool 执行结果，例如执行命令失败，断言失败等这里都是false，之前前面的步骤全部成功才会为true</p>
                    <p>传入的参数2为：info - type array 执行信息，这个说不清楚 很多数据</p>
                    <SyntaxHighlighter language="json" style={docco}>
                        {`
{
    id: "1", //log id
    exec_time: "2020-01-01 00:00:00", //执行时间
    running_time: 1, //运行耗费时间
    result_list：[
        {
            command: "curl -L www.baidu.com", //执行命令
            command_start_status: true, //执行命令开始状态
            command_start_error: "", //执行命令开始错误
            command_exec_status: true, //执行命令执行状态
            command_exec_error: "", //执行命令执行错误
            assert_result: true, //断言结果
            task_result: true, //任务结果
        }
    ], //执行结果列表
    task_info:{
        id: "1", //任务id
        name: "test", //任务名称
        exec_type: "http", //执行类型
        command: "www.baidu.com", //执行命令
        exec_strategy: "", //执行策略
    }
}
                        `}
                    </SyntaxHighlighter>
                    <p>返回结果为一个对象 需要包含2个key</p>
                    <p>Key1：push bool类型 是否需要推送，这里会推送到配置好的微信企业上面 </p>
                    <p>Key2：content string类型 推送的内容，不需要推送这里就直接传空字符串就好了 </p>
                    <SyntaxHighlighter language="javascript" style={docco}>
                        {`
function main(result, info) {
  let content2 = ""
  for(let key  in info['result_list'] ){
    resultItem = info['result_list'][key]
        content2 += \`
最终命令: \${resultItem['command']}
开始状态: \${resultItem['command_start_status']}
开始错误: \${resultItem['command_start_error']}
执行状态: \${resultItem['command_exec_status']}
执行错误: \${resultItem['command_exec_error']}
断言结果: \${resultItem['assert_result']}
任务结果: \${resultItem['task_result']}
\`
  }
  const content = \`任务:\${info['task_info']['name']}
命令: \${info['task_info']['command']}
执行时间: \${info['exec_time']}
详细记录: \${content2}
\`
  return {
    push: true,
    content: content
  }
}
`}
                    </SyntaxHighlighter>
                    <pre>

                    </pre>
                </Box>
            </Popover>
        </React.Fragment>
    );
}