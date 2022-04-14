import { createApp } from 'vue'
import App from './App.vue'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router' // 路由
import 'normalize.css/normalize.css'

createApp(App).use(router).use(ElementPlus).mount('#app')
