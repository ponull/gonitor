package model

import (
	"github.com/jinzhu/gorm"
	"gonitor/core"
	"gonitor/web/context"
	"math"
	"strconv"
	"time"
)

type Base struct {
	ID        int64      `gorm:"column:id;primary_key;AUTO_INCREMENT" json:"id"`
	CreatedAt time.Time  `gorm:"column:create_time" json:"create_time"`
	UpdatedAt time.Time  `gorm:"column:update_time" json:"update_time"`
	DeletedAt *time.Time `gorm:"column:delete_time" sql:"index" json:"delete_time"`
}

type OrmWhereMap = map[string]interface{}

func GetConn() *gorm.DB {
	return core.Db
}

type Pagination struct {
	Limit      int         `json:"limit,omitempty;query:limit"`
	Page       int         `json:"page,omitempty;query:page"`
	Sort       string      `json:"sort,omitempty;query:sort"`
	TotalRows  int64       `json:"total_rows"`
	TotalPages int         `json:"total_pages"`
	Rows       interface{} `json:"list"`
	ormWhere   interface{}
}

func InitPagination(context *context.Context) *Pagination {
	p := &Pagination{}
	pageNumber, err := strconv.ParseInt(context.Param("page_number"), 10, 64)
	if err == nil {
		p.Page = int(pageNumber)
	}
	pageSize, err := strconv.ParseInt(context.Param("page_size"), 10, 64)
	if err == nil {
		p.Limit = int(pageSize)
	}
	return p
}

func (p *Pagination) GetOffset() int {
	return (p.GetPage() - 1) * p.GetLimit()
}
func (p *Pagination) GetLimit() int {
	if p.Limit == 0 {
		p.Limit = 10
	}
	return p.Limit
}
func (p *Pagination) GetPage() int {
	if p.Page == 0 {
		p.Page = 1
	}
	return p.Page
}
func (p *Pagination) GetSort() string {
	if p.Sort == "" {
		p.Sort = "id asc"
	}
	return p.Sort
}

func Paginate(value interface{}, pagination *Pagination) func(db *gorm.DB) *gorm.DB {
	var totalRows int64
	GetConn().Model(value).Where(pagination.ormWhere).Count(&totalRows)
	pagination.TotalRows = totalRows
	totalPages := int(math.Ceil(float64(totalRows) / float64(pagination.Limit)))
	pagination.TotalPages = totalPages
	return func(db *gorm.DB) *gorm.DB {
		return db.Offset(pagination.GetOffset()).Limit(pagination.GetLimit()).Order(pagination.GetSort())
	}
}
