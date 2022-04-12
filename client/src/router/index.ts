import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/home.vue'

const routes = [
    {
        path: '/',
        name: 'home',
        component: Home
    },
    {
        path: '/base',
        name: 'base',
        component: () => import('../views/baseControl.vue') // 动态路由
    },
    {
        path: '/admin',
        name: 'admin',
        component: () => import('../views/form.vue')
    }
]

// 创建路由
const router = createRouter({
    history: createWebHistory(),
    // base: '/blog/', // 设置根目录
    routes
})

console.log('创建路由——————', router)
export default router