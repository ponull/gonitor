//本JS进行一些notistack的常用设置
import React from 'react';
import {SnackbarOrigin, SnackbarProvider} from 'notistack';

/**
 * 显示的消息条的最大数量，如果超过，会关掉最先打开的然后再显示新的，是一个队列
 * 如果只想显示1个，设置为1，3是默认值
 */
const MAX_SNACKBAR = 3
//设置自动隐藏时间，默认值是5秒，也就是5000毫秒
const AUTO_HIDE_DURATION = 3000

//设置消息条位置
class MySnackbarOrigin implements SnackbarOrigin {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';

    constructor() {
        this.vertical = "top"
        this.horizontal = "center"
    }
}

const POSITION = new MySnackbarOrigin()

export const NotistackWrapper = (props:{children: React.ReactNode}):JSX.Element => {
    const {children} = props
    return (
        <SnackbarProvider
            maxSnack={MAX_SNACKBAR}
            autoHideDuration={AUTO_HIDE_DURATION}
            anchorOrigin={POSITION}
        >
            {children}
        </SnackbarProvider>
    )
}
