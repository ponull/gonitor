package core

import (
	"gopkg.in/yaml.v3"
	"io/ioutil"
)

func InitConfig() {
	data, _ := ioutil.ReadFile("config.yml")
	//把yaml形式的字符串解析成struct类型
	err := yaml.Unmarshal(data, &Config)
	if err != nil {
		panic(err)
	}
	if Config.Sqlite.DbPath == "" {
		panic("配置文件读取错误")
	}
}

var Config yoConfig

type yoConfig struct {
	App        app        `yaml:"App"`
	Sqlite     sqlite     `yaml:"Sqlite"`
	HttpServer httpServer `yaml:"HttpServer"`
	Script     script     `yaml:"Script"`
	WeCom      weCom      `yaml:"WeCom"`
}

type sqlite struct {
	DbPath string `yaml:"DbPath"`
}

type httpServer struct {
	Host string `yaml:"Host"`
	Post string `yaml:"Post"`
}

type app struct {
	Debug   bool   `yaml:"Debug"`
	DbLog   bool   `yaml:"DbLog"`
	LogFile string `yaml:"LogFile"`
}

type script struct {
	Folder    string `yaml:"Folder"`
	LogFolder string `yaml:"LogFolder"`
}

type weCom struct {
	CorpId     string `yaml:"CorpId"`
	CorpSecret string `yaml:"CorpSecret"`
	AgentId    string `yaml:"AgentId"`
}
