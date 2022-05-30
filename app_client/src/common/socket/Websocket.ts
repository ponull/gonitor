import Socket from "./Socket";
import {Dispatch, SetStateAction, useEffect, useState} from "react";
const url = `ws://127.0.0.1:8899/ws/${generateClientId()}`;
export type SocketSendType = any
export type SocketResponseResult<RT> = {
    code: number
    msg: string
    data: RT
}
export type SubscribeResponse = {
    event: string
    data: any
}
type EventCallback = Dispatch<SetStateAction<any>>;

export enum SubscribeType {
    TASK = "TASK",
    TASK_lOG = "TASK_LOG",
}
export enum EventType {
    SUBSCRIBE = 'SUBSCRIBE',
    UNSUBSCRIBE = 'UNSUBSCRIBE',
    UPDATE = "UPDATE",
    PING = "PING",
    PONG = "PONG",
}
//已订阅的类型
let subscribed: Map<SubscribeType, Map<number, EventCallback>> = new Map();
const wbSocket = new Socket<SocketSendType, SubscribeResponse>({
    url: url,
    heartMsg: {
        event: EventType.PING,
        data: {
            time: new Date().getTime()
        }
    },
    messageCb: (res: SubscribeResponse) => {
        const {event, data} = res;
        switch (event) {
            case EventType.UPDATE:
                console.log("收到更新信息", data)
                const subscribeType = data.type;
                const targetId = data.id;
                const dataInfo = data.data;
                if (subscribed.has(subscribeType)) {
                    const dispatchList = subscribed.get(subscribeType) as Map<number, EventCallback>;
                    if(dispatchList.has(targetId)){
                        const setStateAction = dispatchList.get(targetId) as EventCallback;
                        setStateAction(dataInfo);
                    }
                }
                break;
            case EventType.PONG:
                console.log("收到服务端心跳回应")
                break;
            default:
                console.log("不明白服务端想说啥")
        }
    },

})

function generateClientId(min: number = 111111, max: number = 999999): number {
    return Math.floor(Math.random() * (max - min) + min);
}
//订阅
export function useSubscribe<T>(subscribeType: SubscribeType, targetId: number, originData:T){
    const [subscribeInfo, setSubscribeInfo] = useState(originData);
    useEffect(()=>{
        wbSocket.send({
            event: EventType.SUBSCRIBE,
            data: {
                type: subscribeType,
                id: targetId,
            },
        });
        if (!subscribed.has(subscribeType)) {
            subscribed.set(subscribeType, new Map<number, EventCallback>());
        }
        const subscribeTypeMap = subscribed.get(subscribeType) as Map<number, EventCallback>;
        subscribeTypeMap.set(targetId, setSubscribeInfo);
        subscribed.set(subscribeType, subscribeTypeMap);
        return ()=>{
            wbSocket.send({
                event: EventType.UNSUBSCRIBE,
                data: {
                    type: subscribeType,
                    id: targetId,
                },
            });
            const subscribeTypeMap = subscribed.get(subscribeType) as Map<number, EventCallback>;
            subscribeTypeMap.delete(targetId);
            subscribed.set(subscribeType, subscribeTypeMap);
        }   
    }, [subscribeType, targetId])
    return [
        subscribeInfo,
    ]
}

export default wbSocket;