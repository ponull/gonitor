import Request from './Request'

let baseUrl = ""
if (process.env.NODE_ENV == "development") {
    baseUrl = 'http://127.0.0.1:8899'
}

const httpRequest = new Request({
    baseURL: baseUrl,
    timeout: 30 * 1000,
    // maxContentLength: 100000000,
    // maxBodyLength: 1000000000,
    interceptors: {
        requestInterceptors: (config) => {
            let token = window.localStorage.getItem('token')
            config.headers.Token = token
            // console.log('触发myRequest1的请求成功拦截器')
            return config
        },
        requestInterceptorsCatch: (error) => {
            // console.log('触发myRequest1的请求失败拦截器')
            return error
        },
        responseInterceptors: (res) => {
            // console.log('触发myRequest1的响应成功拦截器')
            if(res.data.code === 100001){
                window.location.href = '/'
            }
            return res
        },
        responseInterceptorsCatch: (err) => {
            // console.log('触发myRequest1的响应失败拦截器')
            return err
        }
    }
})
export default httpRequest
