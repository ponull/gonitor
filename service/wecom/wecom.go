package wecom

import (
	"encoding/json"
	"fmt"
	"gonitor/core"
	"io/ioutil"
	"log"
	"net/http"
)

//var WecomCid = "wwe369416f1c4fc21b"                             //企业微信公司ID
//var WecomSecret = "XCg9b27jgd07960Ym7j9DcdhgehUKnQIfozFnBYTDko" //企业微信应用Secret
//var WecomAid = "1000002"                                        //企业微信应用ID
var weComConfig = core.Config.WeCom

/*-------------------------------  企业微信服务端API begin  -------------------------------*/

var getTokenApi = "https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=%s&corpsecret=%s"
var sendMessageApi = "https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=%s"
var uploadMediaApi = "https://qyapi.weixin.qq.com/cgi-bin/media/upload?access_token=%s&type=%s"

// ParseJson 将json字符串解析为map
func ParseJson(jsonStr string) map[string]interface{} {
	var wecomResponse map[string]interface{}
	if string(jsonStr) != "" {
		err := json.Unmarshal([]byte(string(jsonStr)), &wecomResponse)
		if err != nil {
			log.Println("生成json字符串错误")
		}
	}
	return wecomResponse
}

// GetRemoteToken 从企业微信服务端API获取access_token，存在redis服务则缓存
func GetRemoteToken() string {
	getTokenUrl := fmt.Sprintf(getTokenApi, weComConfig.CorpId, weComConfig.CorpSecret)
	log.Println("getTokenUrl==>", getTokenUrl)
	resp, err := http.Get(getTokenUrl)
	if err != nil {
		log.Println(err)
	}
	defer resp.Body.Close()
	respData, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Println(err)
	}
	tokenResponse := ParseJson(string(respData))
	log.Println("企业微信获取access_token接口返回==>", tokenResponse)
	accessToken := tokenResponse["access_token"].(string)
	return accessToken
}

func SendTextMessage(content string) {
	msgType := "text"
	msgContent := content
	mediaId := ""
	postData := InitJsonData(msgType)
	postData.Text = Msg{
		Content: msgContent,
	}
	postData.Image = Pic{
		MediaId: mediaId,
	}
	sendMessageUrl := fmt.Sprintf(sendMessageApi, GetRemoteToken())
	PostMsg(postData, sendMessageUrl)
}

func TestSend(content string) {
	msgType := "text"
	msgContent := content
	mediaId := ""
	postData := InitJsonData(msgType)
	postData.Text = Msg{
		Content: msgContent,
	}
	postData.Image = Pic{
		MediaId: mediaId,
	}
	sendMessageUrl := fmt.Sprintf(sendMessageApi, GetRemoteToken())
	postStatus := PostMsg(postData, sendMessageUrl)
	postResponse := ParseJson(postStatus)
	fmt.Println(postResponse)
}
