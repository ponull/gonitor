

enum EventType {
    SUBSCRIBE = 'subscribe',
    UNSUBSCRIBE = 'unsubscribe',
    UPDATE = "UPDATE",
    PING = "PING",
    PONG = "PONG",
}

enum subscribeType {
    TASK = "task",
    TASK_lOG = "task_log",
}

type EventCallback = (data: any) => void;

class WebsocketService {
    private _conn: WebSocket | undefined;
    private subscribed: Map<subscribeType, Map<number, EventCallback>> = new Map();
    public constructor() {
        this.init();
    }

    public sendMessage(message: any) {
        this._conn?.send(JSON.stringify(message));
    }

    public subscribe(subscribeType: subscribeType, targetId: number, callback: (data:any) => void) {
        this.sendMessage({
            event: EventType.SUBSCRIBE,
            data: {
                type: subscribeType,
                id: targetId,
            },
        });
        if (!this.subscribed.has(subscribeType)) {
            this.subscribed.set(subscribeType, new Map<number, EventCallback>());
        }
        const subscribeTypeMap = this.subscribed.get(subscribeType) as Map<number, EventCallback>;
        subscribeTypeMap.set(targetId, callback);
        this.subscribed.set(subscribeType, subscribeTypeMap);
    }

    public unsubscribe(subscribeType: subscribeType, targetId: any) {
        this.sendMessage({
            event: EventType.UNSUBSCRIBE,
            data: {
                type: subscribeType,
                id: targetId,
            },
        });
        const subscribeTypeMap = this.subscribed.get(subscribeType) as Map<number, EventCallback>;
        subscribeTypeMap.delete(targetId);
        this.subscribed.set(subscribeType, subscribeTypeMap);
    }

    public onMessage(message:any)   {
        switch (message.event){
            case EventType.UPDATE:
                this.onUpdate(message.data);
                break;
            case EventType.PING:
                this.sendMessage({
                    event: EventType.PONG,
                    data: {
                        time: new Date().getTime()
                    },
                });
                console.log(this.subscribed)
        }
    }

    public onUpdate(data:any){
        const subscribeType = data.type;
        const targetId = data.id;
        const dataInfo = data.data;
        if (this.subscribed.has(subscribeType)) {
            const callbackInfo = this.subscribed.get(subscribeType) as Map<number, EventCallback>;
            if(callbackInfo.has(targetId)){
                const callback = callbackInfo.get(targetId) as EventCallback;
                callback(dataInfo);
            }
        }
    }

    public onError(event:Event){
        this.reconnect();
    }

    public onClose(){
        this.reconnect();
    }

    public onOpen(){
        //直接获取entries会报错 不是循环对象有问题
        // @ts-ignore
        for(let [subscribeType,subscribeTypeMap] of this.subscribed.entries()){
            for(let [targetId,callback] of subscribeTypeMap.entries()){
                this.subscribe(subscribeType,targetId,callback);
            }
        }
        //https://www.cnblogs.com/waitinglulu/p/11572850.html
    }

    public reconnect(){
        setTimeout(() => {
            this.init();
        }, 1000);
    }

    private init(){
        this._conn = new WebSocket(`ws://127.0.0.1:8899/ws/${generateClientId()}`);
        this._conn.onopen = this.onOpen;
        this._conn.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.onMessage(data);

        };
        this._conn.onerror = (event) => {
            this.onError(event);
        };
        this._conn.onclose = () => {
            this.onClose();
        };
    }

    public close(){
        this._conn?.close();
    }
}

export let subscribableType = subscribeType;

function generateClientId(min: number = 111111, max: number = 999999): number {
    return Math.floor(Math.random() * (max - min) + min);
}
const ws = new WebsocketService();
export default ws;