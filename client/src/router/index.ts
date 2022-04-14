import {createRouter, createWebHistory, RouteRecordRaw} from 'vue-router'

const routes: Array<RouteRecordRaw> = [
    // {
    //     path: '/base',
    //     name: 'base',
    //     component: () => import('../views/baseControl.vue') // 动态路由
    // },
    {
        path: '/admin',
        name: 'admin',
        component: () => import('../view/layout/AdminLayout.vue')
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