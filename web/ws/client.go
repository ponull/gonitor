package ws

import (
	"encoding/json"
	"github.com/gorilla/websocket"
	"log"
	"strconv"
	"time"
)

const (
	SubscribeTypeTask       = "TASK"
	SubscribeTypeTaskLog    = "TASK_LOG"
	SubscribeTypeTaskLogAdd = "TASK_LOG_ADD"
)

// Client 单个 websocket 信息
type Client struct {
	Id         int64
	Socket     *websocket.Conn
	Message    chan []byte
	subscribed map[string]map[int64]bool //['subscribeTypeTask']['taskId'] = true
}

func (client *Client) StartAllService() {
	go client.readService()
	go client.writeService()
	//所有的订阅类型都先加进去，防止读取的时候出问题
	client.subscribed = map[string]map[int64]bool{
		SubscribeTypeTask:    make(map[int64]bool),
		SubscribeTypeTaskLog: make(map[int64]bool),
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
		selfMessage := make(map[string]interface{})
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
			client.subscribe(SubscribeTypeTask, 1)
		case "UNSUBSCRIBE":
			client.unsubscribe(SubscribeTypeTask, 1)
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

func (client *Client) subscribe(subscriptionType string, taskId int64) {
	//已经订阅就算了
	client.toggleSubscribe(subscriptionType, taskId, true)
}

func (client *Client) unsubscribe(subscriptionType string, taskId int64) {
	//已经订阅就算了
	client.toggleSubscribe(subscriptionType, taskId, false)
}

func (client *Client) toggleSubscribe(subscriptionType string, taskId int64, isSubscribe bool) {
	//已经订阅就算了
	_, ok := client.subscribed[subscriptionType]
	if !ok {
		client.Message <- []byte("cannot find subscriptionType")
		return
	}
	client.subscribed[subscriptionType][taskId] = isSubscribe
}

func (client *Client) success(data map[string]interface{}) map[string]interface{} {
	return map[string]interface{}{
		"code": 200,
		"data": data,
		"msg":  "",
	}
}

func (client *Client) SendSubscribedInfo(subscribeMessage *subscribeMessage) {
	//_, ok := client.subscribed[subscribeMessage.SubscriptionType][subscribeMessage.ID]
	////没有订阅这个类型或者这个id 就不管
	//log.Println("test111111111", subscribeMessage, client.Id,)
	//if !ok {
	//	return
	//}
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
