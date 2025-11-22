<template>
  <div class="login-container">
    <div class="login-form">
      <h2>图书管理系统 - 登录</h2>
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="rules"
        label-position="top"
        class="form"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            :disabled="loading"
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            placeholder="请输入密码"
            type="password"
            prefix-icon="Lock"
            :disabled="loading"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            @click="handleLogin"
            :loading="loading"
            style="width: 100%"
          >
            登录
          </el-button>
        </el-form-item>
        
        <div class="register-link">
          <span>还没有账号？</span>
          <el-link type="primary" @click="showRegister = true">立即注册</el-link>
        </div>
      </el-form>
    </div>
    
    <!-- 注册对话框 -->
    <el-dialog
      v-model="showRegister"
      title="用户注册"
      width="400px"
      center
    >
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        label-position="top"
        class="form"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            :disabled="registerLoading"
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="registerForm.password"
            placeholder="请输入密码（至少6位）"
            type="password"
            prefix-icon="Lock"
            :disabled="registerLoading"
          />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            placeholder="请再次输入密码"
            type="password"
            prefix-icon="Lock"
            :disabled="registerLoading"
          />
        </el-form-item>
        
        <el-form-item label="邮箱（选填）" prop="email">
          <el-input
            v-model="registerForm.email"
            placeholder="请输入邮箱地址"
            prefix-icon="Message"
            :disabled="registerLoading"
          />
        </el-form-item>
        
        <el-form-item label="昵称（选填）" prop="nickname">
          <el-input
            v-model="registerForm.nickname"
            placeholder="请输入昵称"
            prefix-icon="ChatRound"
            :disabled="registerLoading"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showRegister = false">取消</el-button>
          <el-button
            type="primary"
            @click="handleRegister"
            :loading="registerLoading"
          >
            注册
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage, FormInstance, FormRules } from 'element-plus';
import { useRouter } from 'vue-router';
import { login as loginAPI, register } from "../http/index";
import { login as loginStore } from '../store/auth';

const router = useRouter();

// 登录表单
const loginFormRef = ref<FormInstance>();
const loginForm = reactive({
  username: '',
  password: ''
});

// 注册表单
const registerFormRef = ref<FormInstance>();
const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  nickname: ''
});

// 加载状态
const loading = ref(false);
const registerLoading = ref(false);
const showRegister = ref(false);

// 登录表单验证规则
const rules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度应为2-20个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为6位', trigger: 'blur' }
  ]
});

// 注册表单验证规则
const registerRules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度应为2-20个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  email: [
    {
      type: 'email',
      message: '请输入正确的邮箱地址',
      trigger: 'blur',
      required: false
    }
  ]
});

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return;
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        // 调用登录API
        const response = await loginAPI(loginForm);
        console.log('登录响应:', response);
        if (response.success) {
          ElMessage.success('登录成功');
          // 使用状态管理保存登录信息
          // 根据后端API实际响应格式，token在response.data.token中，用户信息在response.data中
          loginStore(response.data.token, response.data);
          // 跳转到首页
          router.push('/');
        } else {
          ElMessage.error(response.message || '登录失败');
        }
      } catch (error) {
        console.error('登录请求失败:', error);
        ElMessage.error('登录失败，请稍后重试');
      } finally {
        loading.value = false;
      }
    }
  });
};

// 处理注册
const handleRegister = async () => {
  if (!registerFormRef.value) return;
  
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      registerLoading.value = true;
      try {
        // 调用注册API
        const response = await register(registerForm);
        console.log('注册响应:', response);
        if (response.success) {
          ElMessage.success('注册成功，请登录');
          showRegister.value = false;
          // 清空注册表单
          Object.keys(registerForm).forEach(key => {
            (registerForm as any)[key] = '';
          });
        } else {
          ElMessage.error(response.message || '注册失败');
        }
      } catch (error) {
        console.error('注册请求失败:', error);
        ElMessage.error('注册失败，请稍后重试');
      } finally {
        registerLoading.value = false;
      }
    }
  });
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-form {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.login-form h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-weight: 600;
}

.form {
  margin-bottom: 20px;
}

.register-link {
  text-align: center;
  margin-top: 20px;
  color: #606266;
}

.register-link a {
  margin-left: 5px;
}

.dialog-footer {
  text-align: center;
}
</style>