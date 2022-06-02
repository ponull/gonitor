import Socket from "./Socket";
import {useEffect, useState} from "react";

const url = `ws://127.0.0.1:8899/ws/${generateClientId()}`;

export const SubscribeType = {
    TASK: "TASK",
    TASK_lOG: "TASK_LOG",
    TASK_LOG_ADD: "TASK_LOG_ADD",
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
export function useSubscribe(subscribeType, targetId, originData) {
    const [subscribeInfo, setSubscribeInfo] = useState(originData);
    const setSubscribeInfoAction = (data) => {
        setSubscribeInfo({
            ...originData,
            ...data,
        });
    }
    useEffect(() => {
        wbSocket.send({
            event: EventType.SUBSCRIBE,
            data: {
                type: subscribeType,
                id: targetId,
            },
        });
        if (!subscribed.hasOwnProperty(subscribeType)) {
            subscribed[subscribeType] = {};
        }
        const subscribeTypeMap = subscribed[subscribeType];
        subscribeTypeMap[targetId] = setSubscribeInfoAction;
        subscribed[subscribeType] = subscribeTypeMap;
        return () => {
            wbSocket.send({
                event: EventType.UNSUBSCRIBE,
                data: {
                    type: subscribeType,
                    id: targetId,
                },
            });
            const subscribeTypeMap = subscribed[subscribeType];
            delete subscribeTypeMap[targetId];
            subscribed[subscribeType] = subscribeTypeMap;
        }
        //eslint-disable-next-line
    }, [subscribeType, targetId])
    return [
        subscribeInfo,
    ]
}

export default wbSocket;