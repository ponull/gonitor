package ws

import (
	"encoding/json"
	"github.com/gorilla/websocket"
	"log"
	"strconv"
	"time"
)

const (
	SubscribeTypeTask          = "TASK"
	SubscribeTypeTaskLog       = "TASK_LOG"
	SubscribeTypeTaskLogAdd    = "TASK_LOG_ADD"
	SubScribeTypeSystemMonitor = "SYSTEM_MONITOR"
)

// Client 单个 websocket 信息
type SubscribeStruct = map[string]map[int64]bool

type Client struct {
	Id         int64
	Socket     *websocket.Conn
	Message    chan []byte
	subscribed SubscribeStruct //['subscribeTypeTask']['taskId'] = true
}

//websocket 推送的订阅结构
type SubscribeStat struct {
	SubscribeType string `json:"type"`
	TaskId        int64  `json:"id"`
}

func (client *Client) StartAllService() {
	go client.readService()
	go client.writeService()
	//所有的订阅类型都先加进去，防止读取的时候出问题
	client.subscribed = map[string]map[int64]bool{
		SubscribeTypeTask:       make(map[int64]bool),
		SubscribeTypeTaskLog:    make(map[int64]bool),
		SubscribeTypeTaskLogAdd: make(map[int64]bool),
	}
}

func (client *Client) readService() {
	//接收到的消息为websocket.CloseMessage 就退出并且销毁
	defer func() {
		WebsocketManager.Unregister <- client
		err := client.Socket.Close()
		if err != nil {
			log.Printf("disconnect err client id %s", client.Id)
		}
	}()
	for {
		messageType, message, err := client.Socket.ReadMessage()
		if err != nil || messageType == websocket.CloseMessage {
			break
		}
		//todo 解析消息内容  看看订阅的是什么东西
		//todo 分发消息处理器
		selfMessage := make(map[string]string)
		err = json.Unmarshal(message, &selfMessage)
		//解析失败 通知前端
		if err != nil {
			log.Println("cannot parse message")
			continue
		}
		event := selfMessage["event"]
		log.Println(selfMessage)
		switch event {
		case "SUBSCRIBE":
			data := selfMessage["data"]
			subscribeState := SubscribeStat{}
			err = json.Unmarshal([]byte(data), &subscribeState)
			//解析失败 通知前端
			if err != nil {
				log.Println("cannot parse message data", err)
				continue
			}
			//todo 下面这两个打印是临时去掉 方便观察日志，这个取消订阅好像有问题  一直订阅的内容都比较多 特别是log
			//fmt.Printf("用户%d订阅了%s类型id%d\n", client.Id, subscribeState.SubscribeType, subscribeState.TaskId)
			client.Subscribe(subscribeState.SubscribeType, subscribeState.TaskId)
			//fmt.Println("订阅之后的结果", client.subscribed)
		case "UNSUBSCRIBE":
			data := selfMessage["data"]
			subscribeState := SubscribeStat{}
			err = json.Unmarshal([]byte(data), &subscribeState)
			//解析失败 通知前端
			if err != nil {
				log.Println(data)
				//log.Println("cannot parse message data")
				continue
			}
			client.Unsubscribe(subscribeState.SubscribeType, subscribeState.TaskId)
		case "PING":
			pongMsg := client.success(map[string]interface{}{
				"event": "PONG",
				"data": map[string]string{
					"time": strconv.FormatInt(time.Now().Unix(), 10),
				},
			})
			pongMsgStr, err := json.Marshal(pongMsg)
			if err != nil {
				log.Println("json fail", err)
			}
			client.Message <- pongMsgStr
		}
	}
}

func (client *Client) writeService() {
	//通道被关闭
	defer func() {
		err := client.Socket.Close()
		if err != nil {
			log.Printf("disconnect err client id %s", client.Id)
		}
	}()
	for {
		select {
		case message, ok := <-client.Message:
			if !ok {
				_ = client.Socket.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			err := client.Socket.WriteMessage(websocket.TextMessage, message)
			if err != nil {
				log.Println("send message fail")
			}
		}
	}
}

func (client *Client) Subscribe(subscriptionType string, taskId int64) {
	//fmt.Println("subscribe", subscriptionType, taskId)
	//已经订阅就算了
	client.toggleSubscribe(subscriptionType, taskId, true)
	//fmt.Println("subscribe end", client.subscribed[subscriptionType])
}

func (client *Client) Unsubscribe(subscriptionType string, taskId int64) {
	//fmt.Println("unsubscribe", subscriptionType, taskId)
	//已经订阅就算了
	client.toggleSubscribe(subscriptionType, taskId, false)
	//fmt.Println("unsubscribe end", client.subscribed[subscriptionType])
}

func (client *Client) IsSubscribed(subscriptionType string, taskId int64) bool {
	subscriptionTypeMap, ok := client.subscribed[subscriptionType]
	if !ok {
		return false
	}
	if _, ok := subscriptionTypeMap[taskId]; !ok {
		return false
	}
	return true
}

func (client *Client) GetSubscribed() map[string]map[int64]bool {
	return client.subscribed
}

func (client *Client) toggleSubscribe(subscriptionType string, taskId int64, isSubscribe bool) {
	//已经订阅就算了
	_, ok := client.subscribed[subscriptionType]
	if !ok {
		client.subscribed[subscriptionType] = make(map[int64]bool)
		//return
	}
	//不用之前那个赋值true和false  否则这个结构会越来也大，不会清理
	if !isSubscribe {
		delete(client.subscribed[subscriptionType], taskId)
		return
	} else {
		client.subscribed[subscriptionType][taskId] = isSubscribe
	}
}

func (client *Client) success(data map[string]interface{}) map[string]interface{} {
	return map[string]interface{}{
		"code": 200,
		"data": data,
		"msg":  "",
	}
}

func (client *Client) SendSubscribedInfo(subscribeMessage *subscribeMessage) {
	open, ok := client.subscribed[subscribeMessage.SubscriptionType][subscribeMessage.ID]
	//没有订阅这个类型或者这个id 就不管
	if !ok || !open {
		return
	}

	updateMsg := client.success(map[string]interface{}{
		"event": "UPDATE",
		"data": map[string]interface{}{
			"type": subscribeMessage.SubscriptionType,
			"id":   subscribeMessage.ID,
			"data": subscribeMessage.Data,
		},
	})
	updateMsgStr, err := json.Marshal(updateMsg)
	if err != nil {
		log.Println("json fail", err)
		return
	}
	client.Message <- updateMsgStr

	//client.Message <- subscribeMessage.message
}
