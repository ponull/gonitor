import Socket from "./Socket";
import {useEffect, useRef, useState} from "react";

let baseUrl = window.location.host
if (process.env.NODE_ENV == "development") {
    baseUrl = 'http://127.0.0.1:8899'
}
const url = `ws://${baseUrl}/ws/${generateClientId()}`;

export const SubscribeType = {
    TASK: "TASK",
    TASK_lOG: "TASK_LOG",
    TASK_LOG_ADD: "TASK_LOG_ADD",
    SYSTEM_MONITOR: "SYSTEM_MONITOR",
}

const EventType = {
    SUBSCRIBE: 'SUBSCRIBE',
    UNSUBSCRIBE: 'UNSUBSCRIBE',
    UPDATE: "UPDATE",
    PING: "PING",
    PONG: "PONG",
}
//已订阅的类型
let subscribed = {};
const wbSocket = new Socket({
    url: url,
    heartMsg: {
        event: EventType.PING,
        data: {
            time: new Date().getTime()
        }
    },
    messageCb: (res) => {
        const {event, data} = res;
        switch (event) {
            case EventType.UPDATE:
                const subscribeType = data.type;
                const targetId = data.id;
                const dataInfo = data.data;
                if (subscribed.hasOwnProperty(subscribeType)) {
                    const dispatchList = subscribed[subscribeType];
                    if (dispatchList.hasOwnProperty(targetId)) {
                        const handlers = dispatchList[targetId];
                        Object.values(handlers).forEach((handler) => {
                            handler(dataInfo);
                        })
                    }
                }
                break;
            case EventType.PONG:
                // console.log("收到服务端心跳回应")
                break;
            default:
            // console.log("不明白服务端想说啥")
        }
    },
})

function generateClientId(min = 111111, max = 999999) {
    return Math.floor(Math.random() * (max - min) + min);
}

function getRandomString(len) {
    let _charStr = 'abacdefghjklmnopqrstuvwxyzABCDEFGHJKLMNOPQRSTUVWXYZ0123456789',
        min = 0,
        max = _charStr.length - 1,
        _str = '';                    //定义随机字符串 变量
    //判断是否指定长度，否则默认长度为15
    len = len || 15;
    //循环生成字符串
    for (let i = 0, index; i < len; i++) {
        index = (function (randomIndexFunc, i) {
            return randomIndexFunc(min, max, i, randomIndexFunc);
        })(function (min, max, i, _self) {
            let indexTemp = Math.floor(Math.random() * (max - min + 1) + min),
                numStart = _charStr.length - 10;
            if (i === 0 && indexTemp >= numStart) {
                indexTemp = _self(min, max, i, _self);
            }
            return indexTemp;
        }, i);
        _str += _charStr[index];
    }
    return _str;
}

//订阅
export function useSubscribe(subscribeType, targetId, receiveCb) {

    const latestReceiveCb = useRef((data) => {
    });
    const callReceive = (data) => {
        latestReceiveCb.current(data);
    }
    useEffect(() => {
        latestReceiveCb.current = receiveCb;
    }, [receiveCb]);
    const handlerKey = getRandomString(30);
        useEffect(() => {
            // console.log("useSubscribe", subscribeType, targetId, originData);
            //这个提前主动合并的原因是，如果没有收到推送，那么外面传进来的值变化了，就不会收到更新
            // setSubscribeInfoAction(originData);
            wbSocket.send({
                event: EventType.SUBSCRIBE,
                data: JSON.stringify({
                    type: subscribeType,
                    id: parseInt(targetId),
                }),
            });
            if (!subscribed.hasOwnProperty(subscribeType)) {
                subscribed[subscribeType] = {};
            }
            const subscribeTypeMap = subscribed[subscribeType];
            if (!subscribeTypeMap.hasOwnProperty(targetId)){
                subscribeTypeMap[targetId] = {}
            }
            subscribeTypeMap[targetId][handlerKey] = callReceive;
            subscribed[subscribeType] = subscribeTypeMap;
            return () => {
                wbSocket.send({
                    event: EventType.UNSUBSCRIBE,
                    data: JSON.stringify({
                        type: subscribeType,
                        id: parseInt(targetId),
                    }),
                });
                const subscribeTypeMap = subscribed[subscribeType];
                delete subscribeTypeMap[targetId][handlerKey];
                subscribed[subscribeType] = subscribeTypeMap;
            }
            //eslint-disable-next-line
        }, [subscribeType, targetId]);
}

export default wbSocket;