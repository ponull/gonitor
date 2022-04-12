package web

import (
	"github.com/gin-gonic/gin"
	"gonitor/core"
	"gonitor/web/kernel"
	"gonitor/web/routes"
	"gonitor/web/yogo"
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

func StartService() {
	defer yogo.Db.Close()
	//ws.StartAllService()
	r := gin.Default()
	kernel.Load()
	routes.Load(r)
	r.Run(core.Config.HttpServer.Host + ":" + core.Config.HttpServer.Post)
}
