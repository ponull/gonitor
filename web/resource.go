package web

import (
	"embed"
	"errors"
	"fmt"
	"io/fs"
	"path"
	"path/filepath"
	"strings"
)

type Resource struct {
	fs   embed.FS
	path string
}

func NewResource() *Resource {
	return &Resource{
		fs:   Static,
		path: "client/build",
	}
}

func (r *Resource) Open(name string) (fs.File, error) {
	if filepath.Separator != '/' && strings.ContainsRune(name, filepath.Separator) {
		return nil, errors.New("http: invalid character in file path")
	}
	//fl, err := r.fs.Open("client/build/static/js/main.16952fd0.js")
	//if err != nil {
	//	fmt.Println("error", err.Error())
	//}
	//fmt.Println(fl)
	//todo windows转了之后不认识  linux未测试
	fullName := filepath.Join(r.path, filepath.FromSlash(path.Clean("/static/"+name)))
	fullName = strings.ReplaceAll(fullName, "\\", string('/'))
	//fullName := filepath.Join(r.path, path.Clean("/static/"+name))
	//fmt.Println(filepath.FromSlash(fullName))
	//fmt.Println()
	//fmt.Println("打开固定文件方式1")
	//_, err := r.fs.ReadFile(`client\build\static\js\main.16952fd0.js`)
	//if err != nil {
	//	fmt.Println("打开固定文件方式1失败", err)
	//}
	//fmt.Println("打开固定文件方式2")
	//_, err = r.fs.ReadFile(`client/build/static/js/main.16952fd0.js`)
	//if err != nil {
	//	fmt.Println("打开固定文件方式2失败", err)
	//}
	//fmt.Println("打开文件")
	file, err := r.fs.Open(fullName)
	if err != nil {
		fmt.Println("打开文件失败", err.Error())
	}
	return file, err
}
