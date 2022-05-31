import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
//这里是拦截器的接口类型
interface MYInterceptors<T = AxiosResponse> {
    requestInterceptors?: (config: AxiosRequestConfig) => AxiosRequestConfig
    requestInterceptorsCatch?: (error: any) => any
    responseInterceptors?: (res: T) => T
    responseInterceptorsCatch?: (error: any) => any
}
//请求对象config需要进行扩展
interface MYRequestConfig extends AxiosRequestConfig {
    interceptors?: MYInterceptors
}

class Request {
    instance: AxiosInstance
    interceptors?: MYInterceptors
    constructor(config: MYRequestConfig) {
        this.instance = axios.create(config)
        this.interceptors = config.interceptors

        this.instance.interceptors.request.use(
            this.interceptors?.requestInterceptors,
            this.interceptors?.requestInterceptorsCatch
        )
        this.instance.interceptors.response.use(
            this.interceptors?.responseInterceptors,
            this.interceptors?.responseInterceptorsCatch
        )
    }

    request(config: AxiosRequestConfig): void {
        this.instance.request(config).then((res) => {
            console.log(res)
        })
    }

    get(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
        return this.instance.get(url, config)
    }

    post(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<any>> {
        return this.instance.post(url, data, config)
    }
}

export default Request
