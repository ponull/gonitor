import axios from 'axios'

class Result {
    constructor(code = 500021, message = "", data = null) {
        this.code = code;
        this.message = message;
        this.data = data;
    }
}

class Request {
    constructor(config) {
        this.instance = axios.create(config)
        this.interceptors = config.interceptors

        this.instance.interceptors.request.use(
            this.interceptors.requestInterceptors,
            this.interceptors.requestInterceptorsCatch
        )
        this.instance.interceptors.response.use(
            this.interceptors.responseInterceptors,
            this.interceptors.responseInterceptorsCatch
        )
    }

    request(config) {
        this.instance.request(config).then((res) => {
            console.log(res)
        })
    }

    delete(url, config = {}) {
        return new Promise((resolve, reject) => {
            this.instance.delete(url, config)
                .then((res) => {
                    return resolve(res.data)
                })
                .catch((err) => {
                    return reject(err)
                })
        })
    }

    put(url, config = {}) {
        return new Promise((resolve, reject) => {
            this.instance.put(url, config)
                .then((res) => {
                    return resolve(res.data)
                })
                .catch((err) => {
                    return reject(err)
                })
        })
    }

    get(url, config = {}) {
        return new Promise((resolve, reject) => {
            this.instance.get(url, config)
                .then((res) => {
                    return resolve(res.data)
                })
                .catch((err) => {
                    return reject(err)
                })
        })
    }

    post(url, data, config) {
        return new Promise((resolve, reject) => {
            this.instance.post(url, data, config)
                .then((res) => {
                    return resolve(res.data)
                })
                .catch((err) => {
                    return reject(err)
                })
        })
    }
}

export default Request
