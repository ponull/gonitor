package ws

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
	"strconv"
	"time"
)

type subscribeMessage struct {
	SubscriptionType string      `json:"type"`
	ID               int64       `json:"id"`
	Data             interface{} `json:"data"`
}

type Manager struct {
	ClientList           map[int64]*Client
	Register, Unregister chan *Client
	subscribeMessage     chan *subscribeMessage
}

func (manager *Manager) Start() {
	manager.startKeepAliveService()
	for {
		select {
		//注册用户
		case client := <-manager.Register:
			manager.ClientList[client.Id] = client
		//注销用户
		case client := <-manager.Unregister:
			delete(manager.ClientList, client.Id)
		case subscribeMessage := <-manager.subscribeMessage:
			for _, client := range manager.ClientList {
				client.SendSubscribedInfo(subscribeMessage)
			}
		}
	}
}

func (manager *Manager) SendSubscribed(subscriptionType string, id int64, data interface{}) {
	manager.subscribeMessage <- &subscribeMessage{
		SubscriptionType: subscriptionType,
		ID:               id,
		Data:             data,
	}
}

func (manager *Manager) startKeepAliveService() {
	//cronIns := cron.New()
	//pingMsg := map[string]interface{}{
	//	"event": "PING",
	//	"data": map[string]string{
	//		"time": strconv.FormatInt(time.Now().Unix(), 10),
	//	},
	//}
	//pingMsgStr, err := json.Marshal(pingMsg)
	//if err != nil {
	//	log.Fatal(err)
	//}
	//cronIns.AddFunc("@every 1s", func() {
	//	for _, client := range manager.ClientList {
	//		client.Message <- pingMsgStr
	//		log.Println(client.Message)
	//	}
	//})
	//cronIns.Start()
}

func (manager *Manager) RegisterClient(client *Client) {
	manager.Register <- client
	fmt.Println(manager.Register)
}
func (manager *Manager) UnregisterClient(client *Client) {
	manager.Unregister <- client
	fmt.Println(manager.Unregister)
}

//WsClient gin 处理 websocket handler
func (manager *Manager) WsClient(ctx *gin.Context) {
	upGrader := websocket.Upgrader{
		// cross origin domain
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
		// 处理 Sec-WebSocket-Protocol Header
		Subprotocols: []string{ctx.GetHeader("Sec-WebSocket-Protocol")},
	}

	conn, err := upGrader.Upgrade(ctx.Writer, ctx.Request, nil)
	if err != nil {
		log.Printf("websocket connect error: %s", ctx.Param("channel"))
		return
	}
	clientId, err := strconv.ParseInt(ctx.Param("clientId"), 10, 64)
	client := &Client{
		Id:      clientId,
		Socket:  conn,
		Message: make(chan []byte, 1024),
	}
	manager.RegisterClient(client)
	client.StartAllService()
	time.Sleep(time.Second * 15)
}

var WebsocketManager = Manager{
	ClientList:       make(map[int64]*Client),
	Register:         make(chan *Client),
	Unregister:       make(chan *Client),
	subscribeMessage: make(chan *subscribeMessage),
}

func StartAllService() {
	go WebsocketManager.Start()
}
