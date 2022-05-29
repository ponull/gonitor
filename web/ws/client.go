package ws

import (
	"encoding/json"
	"github.com/gorilla/websocket"
	"log"
)

const (
	subscribeTypeTask    = "TASK"
	subscribeTypeTaskLog = "TASK_LOG"
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
		subscribeTypeTask:    make(map[int64]bool),
		subscribeTypeTaskLog: make(map[int64]bool),
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
			client.Message <- []byte("cannot parse message")
			break
		}
		event := selfMessage["event"]
		log.Println(selfMessage)
		switch event {
		case "subscribe":
			client.subscribe(subscribeTypeTask, 1)
		case "unsubscribe":
			client.unsubscribe(subscribeTypeTask, 1)
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
