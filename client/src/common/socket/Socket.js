import {SocketResponseResult} from "./Websocket";


/**
 * 心跳基类
 */

export class Heart {
    heartTimeOut = null // 心跳计时器
    ServerHeartTimeOut = null // 心跳计时器
    timeout = 5000

    // 重置
    reset() {
        clearTimeout(this.heartTimeOut)
        clearTimeout(this.ServerHeartTimeOut)
    }

    /**
     * 启动心跳
     * @param {Function} cb 回调函数
     */
    start(cb) {
        this.heartTimeOut = setTimeout((e) => {
            cb(e)
            this.ServerHeartTimeOut = setTimeout((e) => {
                cb(e)
                // 重新开始检测
                this.reset()
                this.start(cb)
            }, this.timeout)
        }, this.timeout)
    }
}

export default class Socket extends Heart {
    /**
     * @var ws websocket对象
     */
    ws = null
    reconnectTimer = null// 重连计时器
    reconnectCount = 10// 变量保存，防止丢失
    options = {
        url: null, // 链接的通道的地址
        heartTime: 5000, // 心跳时间间隔
        heartMsg: 'ping', // 心跳信息,默认为'ping'
        isReconnect: true, // 是否自动重连
        isRestory: false, // 是否销毁
        reconnectTime: 5000, // 重连时间间隔
        reconnectCount: 5, // 重连次数 -1 则不限制跳前的回调
        openCb: (e) => {
            console.log('Default callback for socket opened', e);
        },// 回调
        closeCb: (e) => {
            console.warn('Closed default callback', e)
        }, // 关闭的回调
        messageCb: (e) => {
            console.log('Default callback for messages received', e)
        }, // 消息的回调
        errorCb: (e) => {
            console.error('wrong default callback', e)
        } // 错误的回调
    }

    constructor(ops) {
        super()
        Object.assign(this.options, ops)
        this.create()
    }

    /**
     * 建立连接
     */
    create() {
        if (!('WebSocket' in window)) {
            throw new Error('The current browser does not support it and cannot be used')
        }
        if (!this.options.url) {
            throw new Error('The address does not exist, the channel cannot be established')
        }
        // this.ws = null
        this.ws = new WebSocket(this.options.url)
        this.onOpen(this.options.openCb)
        this.onClose(this.options.closeCb)
        this.onError(this.options.errorCb)
        this.onMessage(this.options.messageCb)
    }

    /**
     * 自定义连接成功事件
     * 如果callback存在，调用callback，不存在调用OPTIONS中的回调
     * @param {Function} callback 回调函数
     */
    onOpen(callback) {
        this.ws.onopen = event => {
            clearTimeout(this.reconnectTimer) // 清除重连定时器
            this.options.reconnectCount = this.reconnectCount // 计数器重置
            // 建立心跳机制
            super.reset()
            super.start(() => {
                this.send(this.options.heartMsg)
            })
            if (typeof callback === 'function') {
                callback(event)
            } else {
                typeof this.options.openCb === 'function' && this.options.openCb(event)
            }
        }
    }

    /**
     * 自定义关闭事件
     * 如果callback存在，调用callback，不存在调用OPTIONS中的回调
     * @param {Function} callback 回调函数
     */
    onClose(callback) {
        this.ws.onclose = event => {
            super.reset()
            !this.options.isRestory && this.onReconnect()
            if (typeof callback === 'function') {
                callback(event)
            } else {
                typeof this.options.closeCb === 'function' && this.options.closeCb(event)
            }
        }
    }

    /**
     * 自定义错误事件
     * 如果callback存在，调用callback，不存在调用OPTIONS中的回调
     * @param {Function} callback 回调函数
     */
    onError(callback) {
        this.ws.onerror = event => {
            if (typeof callback === 'function') {
                callback(event)
            } else {
                typeof this.options.errorCb === 'function' && this.options.errorCb(event)
            }
        }
    }

    /**
     * 自定义消息监听事件
     * 如果callback存在，调用callback，不存在调用OPTIONS中的回调
     * @param {Function} callback 回调函数
     */
    onMessage(callback) {
        this.ws.onmessage = (messageEvent: MessageEvent<string>) => {
            const strMessage = messageEvent.data
            const {code, data, msg}: SocketResponseResult<RT> = JSON.parse(strMessage)

            if (code === 200) {
                // 收到任何消息，重新开始倒计时心跳检测
                super.reset()
                super.start(() => {
                    this.send(this.options.heartMsg)
                })
                if (typeof callback === 'function') {
                    callback(data)
                } else {
                    typeof this.options.messageCb === 'function' && this.options.messageCb(data)
                }
            } else {
                console.log("status not 200", msg)
            }
        }
    }

    /**
     * 自定义发送消息事件
     * @param {String} data 发送的文本
     */
    send(data) {
        if (this.ws.readyState !== this.ws.OPEN) {
            throw new Error('Not connected to server, cannot push')
        }
        data = JSON.stringify(data)
        this.ws.send(data)
    }

    /**
     * 连接事件
     */
    onReconnect() {
        if (this.options.reconnectCount > 0 || this.options.reconnectCount === -1) {
            this.reconnectTimer = setTimeout(() => {
                this.create()
                if (this.options.reconnectCount !== -1) {
                    this.options.reconnectCount--
                }
            }, this.options.reconnectTime)
        } else {
            clearTimeout(this.reconnectTimer)
            this.options.reconnectCount = this.reconnectCount
        }
    }

    /**
     * 销毁
     */
    destroy() {
        super.reset()
        clearTimeout(this.reconnectTimer) // 清除重连定时器
        this.options.isRestory = true
        this.ws.close()
    }
}

