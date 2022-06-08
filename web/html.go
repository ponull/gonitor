package web

import "embed"

//go:embed client/build/index.html
var Html []byte

//go:embed client/build/manifest.json
var Manifest []byte

//go:embed client/build/logo192.png
var Logo []byte

//go:embed client/build/static/*
var Static embed.FS
