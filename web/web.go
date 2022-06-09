package web

import (
	"github.com/gin-gonic/gin"
	"gonitor/core"
	"gonitor/web/kernel"
	"gonitor/web/routes"
	"gonitor/web/ws"
	"net/http"
)

//func init() {
//	if os.Getppid() != 1 {
//		cmd := exec.Command(os.Args[0], os.Args[1:]...)
//		cmd.Start()
//		os.Exit(0)
//	}
//
//	// 监听系统信号
//	go func() {
//		_c := make(chan os.Signal, 1)
//		signal.Notify(_c, os.Interrupt, syscall.SIGHUP, syscall.SIGINT, syscall.SIGTERM, syscall.SIGQUIT, syscall.SIGKILL)
//		msg := <-_c
//		log.Println(msg)
//		os.Exit(0)
//	}()
//}
//
//func a() {
//	go func() {
//		fp, _ := os.OpenFile("log", os.O_WRONLY|os.O_CREATE|os.O_APPEND, 0644)
//		log.SetOutput(fp)
//		for {
//			log.Println(fmt.Sprint("hello ", os.Getpid()))
//			time.Sleep(time.Second * 5)
//		}
//	}()
//
//	for {
//		time.Sleep(time.Second * 1000)
//	}
//}

type HtmlHandler struct{}

func NewHtmlHandler() *HtmlHandler {
	return &HtmlHandler{}
}

// RedirectIndex 重定向
func (h *HtmlHandler) RedirectIndex(c *gin.Context) {
	c.Redirect(http.StatusFound, "/ui")
	return
}

func (h *HtmlHandler) Index(c *gin.Context) {
	c.Header("content-type", "text/html;charset=utf-8")
	c.String(200, string(Html))
	return
}

func (h *HtmlHandler) Manifest(c *gin.Context) {
	c.Header("content-type", "text/html;charset=utf-8")
	c.String(200, string(Manifest))
	return
}

func (h *HtmlHandler) Logo(c *gin.Context) {
	c.Header("content-type", "text/html;charset=utf-8")
	c.String(200, string(Logo))
	return
}

func StartService() {
	defer core.Db.Close()
	ws.StartAllService()
	r := gin.Default()
	//静态资源
	r.StaticFS("/static", http.FS(NewResource()))
	//ui路由
	html := NewHtmlHandler()
	group := r.Group("/")
	{
		group.GET("", html.Index)
	}
	r.GET("/manifest.json", html.Manifest)
	r.GET("/logo192.png", html.Logo)
	r.NoRoute(html.Index)
	kernel.Load()
	routes.Load(r)
	r.Run(core.Config.HttpServer.Host + ":" + core.Config.HttpServer.Post)
}
