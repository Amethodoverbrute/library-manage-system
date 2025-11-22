import axios from "axios";  // 🔄 导入axios库，用于发送HTTP请求

/* 
🌐 HTTP配置模块说明：
📝 作用：统一管理前端与后端的HTTP通信
💡 特点：支持环境适配、拦截器调试、类型安全
🔧 功能：封装CRUD操作、参数验证、错误处理
*/

// ✅ 环境检测和基础配置
const isDevelopment = import.meta.env.DEV;  // 🌏 检测当前环境：
                                             // true - 开发环境（npm run dev）
                                             // false - 生产环境（npm run build）

console.log('🔧 当前环境:', isDevelopment ? 'Development' : 'Production'); // 调试信息

// ✅ 配置axios实例，根据环境动态选择基础URL
// 📡 基础URL配置：根据开发环境选择直连或代理路径
const baseURL = isDevelopment ? 'http://127.0.0.1:8000' : '/api'; 
                        // 🌍 开发环境：直连后端 http://127.0.0.1:8000
                        // 🌐 生产环境：使用代理路径 /api（通过Nginx代理）

// 💡 环境适配说明：
// - 开发环境：baseURL = 'http://127.0.0.1:8000' （直接访问后端，避免代理问题）
// - 生产环境：baseURL = '/api'（通过Nginx反向代理访问后端）
// - 这样可以避免开发环境的代理配置问题

console.log('🌐 axios基础URL:', baseURL); // 调试信息

// 🔧 创建axios实例
const api = axios.create({
  baseURL: baseURL,            // 📡 使用环境适配后的基础URL
                                // 开发环境：http://127.0.0.1:8000 （直连后端）
                                // 生产环境：/api （代理路径）
  timeout: 10000,              // ⏰ 请求超时时间：10秒（防止长时间等待）
  headers: {                   // 📋 默认请求头
    'Content-Type': 'application/json', // JSON数据格式
  }
});

// ✅ 请求拦截器（发送请求前执行）
api.interceptors.request.use(
  (config) => {
    // 🚀 记录请求信息
    console.log('🚀 发送请求:', config.method?.toUpperCase(), config.url);
    console.log('📋 请求参数:', config.params || config.data);
    
    // 💡 可以在这里添加通用逻辑：
    // - 添加认证token
    // - 设置语言头
    // - 记录请求时间
    // - 请求去重
    
    // 从localStorage获取token
    const token = localStorage.getItem('token');
    // 如果有token，添加到请求头，使用Bearer格式
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config; // 返回配置对象，继续发送请求。⚠️ 必须返回 config！否则请求不会发出
  },
  (error) => {
    // ❌ 请求配置错误处理
    console.error('❌ 请求错误:', error);
    return Promise.reject(error); // 拒绝Promise，触发catch
  }
);

// ✅ 响应拦截器（收到响应后执行）
api.interceptors.response.use(
  (response) => {
    // ✅ 成功响应处理
    console.log('✅ 收到响应:', response.status, response.config.url);
    console.log('📦 响应数据:', response.data);
    
    // 💡 可以在这里添加通用逻辑：
    // - 数据格式转换
    // - 响应时间记录
    // - 缓存处理
    // - 成功日志
    
    return response; // 返回响应数据，继续后续处理
  },
  (error) => {
    // ❌ 响应错误处理
    console.error('❌ 响应错误:', error.response?.status, error.config?.url);
    console.error('🔍 错误详情:', error.response?.data || error.message);
    
    // 💡 错误处理策略：
    if (error.response?.status === 401) {
      // 🔐 401未认证：清除token并跳转到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // 🚫 403禁止访问：权限不足
    } else if (error.response?.status === 500) {
      // 💥 500服务器错误：后端问题
    } else if (error.code === 'ECONNABORTED') {
      // ⏰ 请求超时：网络慢或服务器响应慢
    }
    
    return Promise.reject(error); // 拒绝Promise，触发调用方的catch
  }
);

/*
🔗 接口参数定义：
📝 说明：定义分页查询的参数接口
💡 作用：TypeScript类型检查，提高代码安全性
*/

// 📄 分页参数接口
interface PaginationParams {
  page?: number;        // 📍 当前页码（从1开始）
  pageSize?: number;    // 📏 每页显示数量
}

// 📄 用户相关接口定义
export interface LoginForm {
  username: string;
  password: string;
}

export interface RegisterForm {
  username: string;
  password: string;
  confirmPassword: string;
  email?: string;
  nickname?: string;
}

export interface User {
  id: number;
  username: string;
  nickname: string;
  email?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user_id?: number;
}

// ✅ 搜索接口（支持分页）
const get = async (keyword: string, pagination?: PaginationParams) => {
  // 🏗️ 构建查询参数
  const params = new URLSearchParams(); // URL参数字典
  
  // 📝 添加搜索关键词
  if (keyword) {
    params.append('keyword', keyword); // 参数名：keyword，值：搜索关键词
  }
  
  // 📄 添加分页参数
  if (pagination) {
    if (pagination.page) {
      params.append('page', pagination.page.toString()); // 页码转为字符串
    }
    if (pagination.pageSize) {
      params.append('limit', pagination.pageSize.toString()); // 每页数量转为字符串
    }
  }
  
  // 🔗 构建完整URL - 使用相对路径，根据环境自动处理前缀
  const paramString = params.toString(); // 将参数转换为URL查询字符串
  const url = paramString ? `?${paramString}` : ''; // 拼装相对URL
  
  // 📊 调试信息
  console.log('🔗 搜索URL:', url);
  console.log('🔍 搜索条件:', { keyword, pagination });
  
  // 🚀 发送GET请求，根据环境自动处理URL前缀
  console.log('🌐 发送GET请求，请求将根据环境自动添加URL前缀');
  const response = await api.get(url);
  console.log('✅ 搜索响应:', response.data);
  return response.data;
};

/*
📚 图书数据接口定义：
💡 作用：TypeScript类型检查，确保数据格式正确
🔧 特点：必填字段+可选字段，兼容性更强
*/

// 📚 图书数据结构接口
interface BookData {
  id?: number;           // 🔢 图书ID（编辑时需要，新增时可选）
  book_name: string;     // 📖 图书名称（必填）
  author: string;        // 👤 作者（必填）
  book_type: string;     // 🏷️ 图书类型（必填）
  remarks?: string;      // 📝 备注（可选）
}

// ✅ 添加图书接口
const add = async (req: BookData) => {
  const url = '/add';
  console.log('🔗 添加图书URL:', url);
  console.log('📝 添加数据:', req);
  
  // 🚀 发送POST请求，使用构建的相对路径
  console.log('🌐 发送POST请求');
  const response = await api.post(url, req);
  console.log('✅ 添加响应:', response.data);
  return response.data;
};

// ✅ 编辑图书接口
const edit = async (req: BookData) => {
  const url = '/edit';
  console.log('🔗 编辑图书URL:', url);
  console.log('✏️ 编辑数据:', req);
  
  // 🚀 发送POST请求，使用构建的相对路径
  console.log('🌐 发送POST请求');
  const response = await api.post(url, req);
  console.log('✅ 编辑响应:', response.data);
  return response.data;
};

// ✅ 删除图书接口 (符合RESTful语义)
const del = async (id: string | number) => {
  // 🔗 构建删除URL，通过路径参数传递ID
  const url = `/delete/${encodeURIComponent(String(id))}`;
  
  console.log('🔗 删除图书URL:', url);
  console.log('🗑️ 删除ID:', id);
  
  // 🚀 发送DELETE请求，符合RESTful规范
  console.log('🌐 发送DELETE请求');
  const response = await api.delete(url);
  console.log('✅ 删除响应:', response.data);
  return response.data;
};

// 📤 登录API
export const login = async (data: LoginForm): Promise<any> => {
  const url = '/login';
  console.log('🔗 登录URL:', url);
  console.log('📝 登录数据:', data);
  
  const response = await api.post(url, data);
  console.log('✅ 登录响应:', response.data);
  return response.data;
};

// 📤 注册API
export const register = async (data: RegisterForm): Promise<any> => {
  // 移除确认密码字段，并确保只发送后端需要的字段
  const { confirmPassword, nickname, ...registerData } = data;
  
  // 如果有nickname且不为空，则添加到注册数据中
  if (nickname && nickname.trim()) {
    registerData.nickname = nickname;
  }
  
  const url = 'register';
  console.log('🔗 注册URL:', url);
  console.log('📝 注册数据:', registerData);
  
  // 确保username和password不为空
  if (!registerData.username || !registerData.password) {
    return {
      success: false,
      message: '用户名和密码不能为空'
    };
  }
  
  const response = await api.post(url, registerData);
  console.log('✅ 注册响应:', response.data);
  return response.data;
};

// 📤 导出所有接口，供其他模块使用
export { get, add, edit, del };

/*
💡 接口使用说明：

1️⃣ 环境适配：
   - 开发环境：baseURL = '/api'（通过Vite代理访问后端）
   - 生产环境：baseURL = '/api'（通过Nginx代理访问后端）
   - 统一使用代理路径，避免CORS问题和路由混乱

2️⃣ 拦截器调试：
   - 请求前：打印请求方法、URL、参数
   - 响应后：打印状态码、URL、数据
   - 错误时：打印错误信息，便于调试

3️⃣ 分页逻辑：
   - page：当前页码（从1开始）
   - pageSize：每页数量
   - 转换为URL查询参数传递给后端

4️⃣ TypeScript类型安全：
   - BookData接口定义数据结构
   - 编译时检查参数类型
   - 运行时保证数据格式正确

5️⃣ 错误处理策略：
   - 网络错误：超时、连接失败
   - 业务错误：参数验证失败
   - 服务器错误：500、502等

🔧 实际使用示例：
// 搜索图书
get('JavaScript', { page: 1, pageSize: 10 })

// 添加图书
add({
  book_name: '深入理解JavaScript',
  author: '张三',
  book_type: '编程',
  remarks: '很好的编程入门书'
})

// 编辑图书
edit({
  id: 1,
  book_name: '深入理解JavaScript（第2版）',
  author: '张三',
  book_type: '编程',
  remarks: '更新版'
})

// 删除图书
del(1)
*/