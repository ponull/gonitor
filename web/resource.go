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
	fullName := filepath.Join(r.path, filepath.FromSlash(path.Clean("/static/"+name)))
	fullName = strings.ReplaceAll(fullName, "\\", string('/'))
	file, err := r.fs.Open(fullName)
	if err != nil {
		fmt.Println("打开文件失败", err.Error())
	}
	return file, err
}
