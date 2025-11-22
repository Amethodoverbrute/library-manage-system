import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../views/HomePage.vue';
import LoginPage from '../components/LoginPage.vue';

// 路由配置数组
const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage,
    meta: { requiresAuth: true } // 需要登录才能访问
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: { requiresAuth: false } // 不需要登录就能访问
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login' // 捕获所有未匹配的路由，重定向到登录页
  }
];

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
});

// 路由守卫
router.beforeEach((to, from, next) => {
  // 检查是否需要登录
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  // 检查是否已登录（从localStorage获取token）
  const isAuthenticated = localStorage.getItem('token') !== null;
  
  // 如果需要登录且未登录，则重定向到登录页
  if (requiresAuth && !isAuthenticated) {
    next('/login');
  } 
  // 如果已登录且尝试访问登录页，则重定向到主页
  else if (isAuthenticated && to.name === 'Login') {
    next('/');
  }
  // 其他情况允许通过
  else {
    next();
  }
});

export default router;