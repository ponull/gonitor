package yogo

var Config yoConfig

type yoConfig struct {
	App        app        `yaml:"App"`
	Sqlite     sqlite     `yaml:"Sqlite"`
	Qinglong   qinglong   `yaml:"Qinglong"`
	HttpServer httpServer `yaml:"HttpServer"`
}

type sqlite struct {
	DbPath string `yaml:"DbPath"`
}

type qinglong struct {
	AuthJsonPath string `yaml:"AuthJsonPath"`
	Host         string `yaml:"Host"`
	ApiToken     string `yaml:"ApiToken"`
}

type httpServer struct {
	Host string `yaml:"Host"`
	Post string `yaml:"Post"`
}

type app struct {
	Debug bool `yaml:"Debug"`
	DbLog bool `yaml:"DbLog"`
}
