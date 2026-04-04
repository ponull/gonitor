package core

import "github.com/jinzhu/gorm"

// Version information set via ldflags at build time
var (
	Version   = "dev"
	BuildTime = "unknown"
	GitCommit = "unknown"
	Component = "master" // "master" or "agent"
)

var (
	Db *gorm.DB
)
