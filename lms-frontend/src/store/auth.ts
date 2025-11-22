import { ref, reactive } from 'vue';
import type { User } from '../http/index';

// 用户信息响应式对象
export const userInfo = ref<User | null>(null);

// 登录状态响应式变量
export const isLoggedIn = ref(false);

// 登录函数
export const login = (token: string, user: User) => {
  // 保存token到localStorage
  localStorage.setItem('token', token);
  // 保存用户信息到localStorage
  localStorage.setItem('user', JSON.stringify(user));
  // 更新响应式状态
  userInfo.value = user;
  isLoggedIn.value = true;
};

// 登出函数
export const logout = () => {
  // 清除localStorage中的数据
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // 重置响应式状态
  userInfo.value = null;
  isLoggedIn.value = false;
};

// 初始化登录状态
export const initAuth = () => {
  // 从localStorage获取token
  const token = localStorage.getItem('token');
  // 从localStorage获取用户信息
  const userStr = localStorage.getItem('user');
  
  if (token && userStr) {
    try {
      // 解析用户信息
      const user = JSON.parse(userStr);
      // 更新响应式状态
      userInfo.value = user;
      isLoggedIn.value = true;
    } catch (error) {
      console.error('解析用户信息失败:', error);
      // 解析失败时清除数据
      logout();
    }
  }
};

// 获取当前登录用户ID
export const getCurrentUserId = (): number | null => {
  return userInfo.value?.id || null;
};

// 获取当前登录用户
export const getCurrentUser = (): User | null => {
  return userInfo.value;
};