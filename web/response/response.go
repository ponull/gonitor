package response

type Response struct {
	data interface{}
}

func Resp() *Response {
	return &Response{}
}

func (r *Response) Json(obj interface{}) *Response {
	r.data = obj
	return r
}

func (r *Response) String(data string) *Response {
	r.data = data
	return r
}

func (r *Response) Byte(data []byte) *Response {
	r.data = data
	return r
}

func (r *Response) GetData() interface{} {
	return r.data
}

func (r *Response) Success(message string, data interface{})  *Response {
	var result = make(map[string]interface{})
	result["code"] = 0
	result["message"] = message
	result["data"] = data
	r.data = result
	return r
}

func (r *Response) Error(code int64, message string, data interface{})  *Response {
	var result = make(map[string]interface{})
	result["code"] = code
	result["message"] = message
	result["data"] = data
	r.data = result
	return r
}
