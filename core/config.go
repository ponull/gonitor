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
	// 兼容旧配置：如果没有配置Database但配置了Sqlite，自动转换
	if Config.Database.Driver == "" && Config.Sqlite.DbPath != "" {
		Config.Database.Driver = "sqlite3"
		Config.Database.DSN = Config.Sqlite.DbPath
	}
	if Config.Database.Driver == "" {
		panic("配置文件读取错误: 需要配置数据库连接")
	}
}

var Config yoConfig

type yoConfig struct {
	App        app        `yaml:"App"`
	Sqlite     sqlite     `yaml:"Sqlite"`
	Database   database   `yaml:"Database"`
	HttpServer httpServer `yaml:"HttpServer"`
	Script     script     `yaml:"Script"`
	WeCom      weCom      `yaml:"WeCom"`
	Agent      agent      `yaml:"Agent"`
}

type sqlite struct {
	DbPath string `yaml:"DbPath"`
}

type database struct {
	Driver string `yaml:"Driver"` // sqlite3, mysql, postgres
	DSN    string `yaml:"DSN"`    // Data Source Name / connection string
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

type agent struct {
	MasterAddress string `yaml:"MasterAddress"` // 主控端地址，仅边缘节点使用
	SecretKey     string `yaml:"SecretKey"`      // 节点通信密钥
	NodeName      string `yaml:"NodeName"`       // 节点名称
}
