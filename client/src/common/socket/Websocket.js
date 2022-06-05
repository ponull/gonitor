import Socket from "./Socket";
import {useEffect, useRef, useState} from "react";

const url = `ws://127.0.0.1:8899/ws/${generateClientId()}`;

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
                        const setStateAction = dispatchList[targetId];
                        setStateAction(dataInfo);
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

//订阅
export function useSubscribe(subscribeType, targetId, receiveCb) {

    const latestReceiveCb = useRef((data) => { });
    const callReceive = (data)=>{
        latestReceiveCb.current(data);
    }
    useEffect(() => {
        latestReceiveCb.current = receiveCb;
    },[receiveCb]);
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
        subscribeTypeMap[targetId] = callReceive;
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
            delete subscribeTypeMap[targetId];
            subscribed[subscribeType] = subscribeTypeMap;
        }
        //eslint-disable-next-line
    }, [subscribeType, targetId]);
}

export default wbSocket;