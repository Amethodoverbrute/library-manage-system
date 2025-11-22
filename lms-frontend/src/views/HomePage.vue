<script setup lang="ts">
/* 
🏠 Vue主应用组件说明：
📝 作用：图书馆管理系统的 主界面组件
💡 功能：搜索、显示、分页、增删改图书数据
🔧 特点：TypeScript + Composition API + Element Plus
*/

// 📦 导入Vue核心API和组件
import { ref, onMounted } from "vue";           // 🎯 Vue 3响应式API
import { useRouter } from 'vue-router';           // 🚦 Vue Router
import BookFormDialog from "../components/BookFormDialog.vue"; // 📝 图书编辑（子）组件
import { get, del } from "../http/index"; // 🌐 HTTP接口方法
import { ElMessage, ElMessageBox } from "element-plus"; // 💬 Element Plus消息提示和确认对话框
// 不再直接使用axios，而是使用http.ts中的封装方法
import { ElIcon } from "element-plus";           // 🔄 Element Plus图标组件
import { Sunny, Moon } from "@element-plus/icons-vue"; // 🌞 太阳和月亮图标
import { userInfo, logout } from "../store/auth"; // 👤 用户状态管理

/* 
🔍 响应式数据状态定义：
💡 作用：管理页面上的所有状态数据
⚡ 特点：数据变化会自动更新界面
📝 类型：使用ref()创建响应式数据
*/

// 🚦 路由实例
const router = useRouter();

// 🌓 主题模式状态（默认白天模式）
const isDarkMode = ref<boolean>(false); // 🎨 控制日/夜间模式切换
                                        // 💡 false: 白天模式(默认), true: 夜间模式

// 📝 搜索关键词状态
const searchVal = ref<string>("");  // 📝 用户输入的搜索关键字
                                    // 💡 用于传递给后端进行模糊查询

// 📊 表格数据状态  
const tableData = ref<Array<any>>([]); // 📋 后端返回的图书数据数组
                                       // 💡 每项包含：id, book_name, author, book_type, remarks

// 💬 对话框显示状态（分离新增和编辑）
const isShowAdd = ref(false);         // 🔄 控制新增对话框的显示状态
                                       // 💡 true - 显示新增对话框，false - 隐藏对话框
const isShowEdit = ref(false);        // 🔄 控制编辑对话框的显示状态  
                                       // 💡 true - 显示编辑对话框，false - 隐藏对话框

/* 
📄 分页状态管理：
💡 作用：记录当前页面的分页信息
🔧 功能：页码、每页数量、总数量等
📊 更新：每次查询后从后端获取最新分页信息
*/

const pagination = ref({
  currentPage: 1,    // 📍 当前页码（从1开始）
  pageSize: 10,      // 📏 每页显示数量（默认10条）
  total: 0,          // 📊 总记录数
  totalPages: 0,     // 🔢 总页数（自动计算）
  hasNext: false,    // ➡️ 是否有下一页（用于按钮状态）
  hasPrev: false,    // ⬅️ 是否有上一页（用于按钮状态）
  from: 0,           // 📈 当前页起始记录数
  to: 0              // 📉 当前页结束记录数
});

/* 
🔄 数据加载函数：
💡 作用：调用后端接口获取图书列表数据
🔧 功能：搜索查询 + 分页处理 + 错误处理
📝 参数：page（页码）、pageSize（每页数量）
⚡ 特点：异步函数，支持await调用
*/

const load = async (page?: number, pageSize?: number) => {
  try {
    // 📊 记录调用信息
    console.log("查询按钮被点击，搜索关键词:", searchVal.value);
    console.log("分页参数:", { page, pageSize });
    
    // 🎯 构建分页参数
    const paginationParams = {
      page: page || pagination.value.currentPage,        // 如果没传参则使用当前页码
      pageSize: pageSize || pagination.value.pageSize    // 如果没传参则使用当前每页数量
    };
    
    // 🌐 调用HTTP接口
    const response = await get(searchVal.value, paginationParams);
    console.log("查询响应:", response);
    
    // 📦 解析后端响应数据 - 适配后端返回格式
    if (response.success && response.data && response.pagination) {
      // 正确格式: 后端返回标准格式包含success、data和pagination字段
      tableData.value = response.data;
      pagination.value.total = response.pagination.total;
    } else if (response.list || response.data) {
      // 格式兼容: response.list 或 response.data 包含所有数据
      tableData.value = response.list || response.data;
      pagination.value.total = response.total || tableData.value.length;
    } else if (Array.isArray(response)) {
      // 格式兼容: 直接返回数据数组
      tableData.value = response;
      pagination.value.total = tableData.value.length;
    } else {
      // 格式3: 空数据
      tableData.value = [];
      pagination.value.total = 0;
    }
    
    // 📊 更新分页信息
    pagination.value.currentPage = page || pagination.value.currentPage;
    pagination.value.pageSize = pageSize || pagination.value.pageSize;
    
    // 如果后端返回了pagination信息，优先使用
    if (response.pagination) {
      pagination.value.totalPages = response.pagination.totalPages || Math.ceil(pagination.value.total / pagination.value.pageSize);
    } else {
      pagination.value.totalPages = Math.ceil(pagination.value.total / pagination.value.pageSize);
    }
    
    // 计算其他分页参数
    pagination.value.from = tableData.value.length > 0
      ? (pagination.value.currentPage - 1) * pagination.value.pageSize + 1
      : 0;
    pagination.value.to = Math.min(
      pagination.value.currentPage * pagination.value.pageSize,
      pagination.value.total
    );
    // 确保hasPrev和hasNext属性正确更新，这对分页箭头按钮状态至关重要
    pagination.value.hasPrev = pagination.value.currentPage > 1;
    pagination.value.hasNext = pagination.value.currentPage < pagination.value.totalPages;
    
    // 📈 调试信息
    console.log("查询结果数量:", tableData.value.length);
    console.log("总数量:", pagination.value.total);
  } catch (error) {
    // 💥 网络错误或请求失败
    console.error("查询请求失败:", error);
    ElMessage.error("查询失败，请稍后重试");
    tableData.value = []; // 清空表格数据
  }
};

/* 
🧪 代理测试功能：
💡 作用：测试前后端连接是否正常
🔧 功能：检测代理配置和网络连通性
📝 使用：开发环境定位问题的工具函数
⚡ 特点：根据环境自动选择测试URL
*/

const testProxy = async () => {
  try {
    console.log("🧪 测试代理连接...");
    
    // 🔧 使用HTTP模块进行测试，使用空搜索词和分页参数
    const response = await get('', { page: 1, pageSize: 1 }); // 💡 调用HTTP模块的get接口
    console.log("✅ 代理测试成功:", response.data);
    
    // 💬 显示成功消息
    const message = response.data.message || response.data || "连接测试成功";
    ElMessage.success(`前后端连接正常！${message}`);
  } catch (error: any) {
    console.error("❌ 代理测试失败:", error);
    
    // 🎯 错误类型判断和提示
    if (error.code === 'ERR_NETWORK') {
      ElMessage.error('网络错误：请检查后端服务是否启动');
    } else if (error.response?.status === 404) {
      ElMessage.error('404错误：接口路径错误');
    } else if (error.response?.status === 500) {
      ElMessage.error('服务器错误：后端接口异常');
    } else if (error.response?.status === 502 || error.response?.status === 503) {
      ElMessage.error('后端服务未启动或端口错误');
    } else {
      ElMessage.error(`代理测试失败: ${error.message}`);
    }
  }
};

/* 
⌨️ 搜索相关事件函数：
💡 作用：处理用户输入和搜索操作
🔧 功能：回车搜索、新增按钮等事件
*/

const enterSearch = async () => {
  // 📝 回车键搜索
  // 💡 用户在搜索框按回车键时触发
  await load(); // 调用load函数执行搜索
};

const goHome = async () => {
  // 🏠 回到主页功能
  // 💡 清空搜索条件并回到第1页显示所有图书
  
  console.log("🏠 回到主页按钮被点击");
  
  // 📝 清空搜索条件
  searchVal.value = ""; // 清空搜索输入框
  
  // 📄 重置分页到第1页
  pagination.value.currentPage = 1; // 设置当前页为第1页
  pagination.value.pageSize = 10;   // 重置每页数量为默认10条
  
  // 🔄 重新加载第1页数据
  await load(1); // 加载第1页的所有图书数据
  
  // 💬 显示提示消息
  ElMessage.success("已回到主页，显示所有图书");
};

const addNew = () => {
  // ➕ 新增图书按钮点击
  console.log("🔍 新增按钮被点击"); // 🔧 添加调试日志
  console.log("📋 点击前isShowAdd状态:", isShowAdd.value); // 🔧 调试输出
  
  isShowAdd.value = true; // 显示新增对话框
  console.log("✅ isShowAdd设置为true:", isShowAdd.value); // 🔧 调试输出
  console.log("📊 计算的isShowAdd || isShowEdit:", isShowAdd.value || isShowEdit.value); // 🔧 调试输出
};

/* 
📝 编辑相关状态和函数：
💡 作用：管理编辑图书的状态和操作
🔧 功能：打开编辑对话框、传递编辑数据
*/

const info = ref<object>({}); // 📋 编辑时的图书数据 - 🔄 此对象将传递给BookFormDialog子组件作为props.info
                              // 💡 存储当前编辑的图书信息，传递给子组件

const handleEdit = (index: number, row: any) => {
  // ✏️ 编辑按钮点击事件
  // 📊 参数：index（行索引）、row（行数据）
  
  console.log("✏️ 编辑按钮被点击，索引:", index, "行数据:", row); // 🔧 添加调试日志
  console.log("📋 编辑前isShowEdit状态:", isShowEdit.value); // 🔧 调试输出
  
  info.value = row; // 📝 将当前行数据存储到info中
  
  isShowEdit.value = true; // 💬 显示编辑对话框
  console.log("✅ 编辑对话框将显示，isShowEdit:", isShowEdit.value); // 🔧 调试输出
};

const handleDelete = async (_index: number, row: any) => {
  // 🗑️ 删除按钮点击事件
  // 📊 参数：index（行索引）、row（行数据）
  
  try {
      // 📝 获取要删除的图书名称，用于确认对话框显示
      const bookName = row.book_name || "该图书"; 
      const confirmMessage = `确定要删除《${bookName}》吗？<br/><br/>⚠️ <strong>此操作将永久删除该图书信息，且无法撤销。</strong>`;
    
    // ⚠️ 显示确认对话框，要求用户明确确认删除操作
    await ElMessageBox.confirm(
      confirmMessage,
      "删除确认",
      {
        confirmButtonText: "确认删除",   // 确认按钮文本
        cancelButtonText: "取消",        // 取消按钮文本
        type: "warning",                 // 警告类型图标（红色警告框）
        title: "谨慎操作",                // 对话框标题
        center: true,                    // 按钮居中对齐
        dangerouslyUseHTMLString: true,   // 支持HTML格式的消息
        distinguishCancelAndClose: true,  // 区分取消和关闭按钮
        customClass: 'delete-confirm-dialog' // 自定义样式类名
      }
    );
    
    // ✅ 用户确认删除，执行删除操作
    // 🌐 调用删除接口
    const response = await del(row.id); // 📤 传递要删除的图书ID
    console.log("删除响应:", response);
    
    // 📋 检查响应结果，适配修改后的HTTP模块返回格式
    let success = false;
    let deleteMessage = "删除成功";

    if (response) {
      if (typeof response === 'object') {
          success = response.success;
          deleteMessage = response.message || (success ? "删除成功" : "删除失败");
        } else if (typeof response === 'string') {
          // 简单字符串响应
          deleteMessage = response;
        }
    }

    if (success) {
      ElMessage.success(deleteMessage);
      pagination.value.currentPage = 1;
      await load(1);
    } else {
      ElMessage.error(deleteMessage || "删除失败");
    }
  } catch (error) {
    // ❌ 处理用户取消操作和系统错误
    if (error !== 'cancel' && error !== 'close') {
      console.error("删除失败:", error);
      ElMessage.error("删除失败，请稍后重试");
    }
    // 如果用户点击取消或关闭按钮，不显示错误信息（正常行为）
  }
};

/* 
🔄 对话框管理函数：
💡 作用：控制addBook组件的显示和隐藏
🔧 功能：关闭对话框、重置状态数据
*/

const closeAdd = async () => {
  // ❌ 关闭新增/编辑对话框并返回主页
  isShowAdd.value = false; // 隐藏新增对话框
  isShowEdit.value = false; // 隐藏编辑对话框
  info.value = {};          // 清空编辑数据
  
  // 🏠 返回首页：清除搜索条件并重置到首页
  searchVal.value = "";       // 清除搜索关键词，回到显示所有图书
  pagination.value.currentPage = 1; // 重置到第1页
  pagination.value.pageSize = 10;   // 重置每页数量为默认值
  
  await load(1); // 重新加载第1页数据，显示完整列表
};

const success = async (message: string) => {
  // ✅ 成功回调（来自子组件）
  // 📝 参数：message（成功提示信息）
  
  isShowAdd.value = false; // 隐藏新增对话框
  isShowEdit.value = false; // 隐藏编辑对话框
  info.value = {};          // 清空编辑数据
  
  ElMessage.success(message); // 显示成功消息
  
  // 🏠 返回首页：清除搜索条件并重置到首页
  searchVal.value = "";       // 清除搜索关键词，回到显示所有图书
  pagination.value.currentPage = 1; // 重置到第1页
  pagination.value.pageSize = 10;   // 重置每页数量为默认值
  
  await load(1); // 重新加载第1页数据，显示完整列表
};

/* 
📄 分页事件处理函数：
💡 作用：响应分页控件的用户操作
🔧 功能：切换页码、改变每页数量
⚡ 特点：每次操作后自动刷新数据
*/

const handlePageChange = async (page: number) => {
  // 📍 页面切换事件
  // 📝 参数：page（目标页码）
  
  pagination.value.currentPage = page; // 更新当前页码
  await load(page); // 重新加载指定页数据
};

const handlePageSizeChange = async (pageSize: number) => {
  // 📏 每页数量改变事件
  // 📝 参数：pageSize（新的每页数量）
  
  pagination.value.pageSize = pageSize; // 更新每页数量
  pagination.value.currentPage = 1;     // 重置到第一页
  await load(1, pageSize);              // 加载第一页数据
};

/* 
🌓 主题切换功能：
💡 作用：切换日/夜间模式并保存用户偏好
🔧 功能：更新状态、添加/移除CSS类、保存到localStorage
📝 使用：点击主题切换按钮时调用
*/

const toggleTheme = () => {
  // 🔄 切换主题模式状态
  isDarkMode.value = !isDarkMode.value;
  
  // 🎨 更新页面主题样式
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark-theme');
    localStorage.setItem('theme', 'dark'); // 💾 保存用户偏好到localStorage
  } else {
    document.documentElement.classList.remove('dark-theme');
    localStorage.setItem('theme', 'light'); // 💾 保存用户偏好到localStorage
  }
  
  // 💬 显示切换成功消息
  const mode = isDarkMode.value ? '夜间模式' : '白天模式';
  ElMessage.success(`已切换到${mode}`);
};

// 🚪 登出方法
const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 调用登出函数
    logout();
    // 跳转到登录页
    router.push('/login');
    ElMessage.success('退出登录成功');
  }).catch(() => {
    // 取消登出
  });
};

/* 
🚀 生命周期钩子：
💡 作用：在组件挂载后自动执行初始化操作
🔧 功能：页面加载时自动获取初始数据和主题偏好
⚡ 特点：只在组件首次挂载时执行一次
*/

onMounted(async () => {
  // 📱 组件挂载完成后执行
  
  // 🌓 从localStorage读取用户的主题偏好
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    isDarkMode.value = true;
    document.documentElement.classList.add('dark-theme');
  }
  
  await load(); // 获取初始数据，填充表格
});
</script>

<template>
  <!-- 
  🖼️ 主页面布局说明：
  💡 作用：图书馆管理系统的主界面
  🎨 样式：响应式设计，支持移动端和桌面端
  🔧 特点：Vue 3 + Element Plus + TypeScript
  -->
  
  <!-- 
  📏 页面主体容器：
  💡 功能：包含搜索、表格、分页三大区域
  🎨 样式：居中显示，最大宽度1200px
  📱 响应式：自适应屏幕尺寸
  -->
  <div id="app">
    <div class="main">
      <!-- 📏 标题、用户信息和主题切换区域 -->
      <div class="header-container">
        <div style="text-align: center; margin-bottom: 10px;"><h1>图书管理系统</h1></div>
        <!-- 👤 用户信息区域 -->
        <div class="user-info">
          <span class="welcome-text">欢迎，{{ userInfo?.nickname || userInfo?.username }}</span>
          <el-button 
            type="danger" 
            @click="handleLogout"
            text
            size="small"
          >
            退出登录
          </el-button>
        </div>
        <!-- 🌓 主题切换按钮 - 位于右上角 -->
        <div class="theme-toggle">
          <el-button 
            type="text" 
            @click="toggleTheme"
            :title="isDarkMode ? '切换到白天模式' : '切换到夜间模式'"
            circle
            size="small"
          >
            <el-icon :size="24">
                <Sunny v-if="isDarkMode" />
                <Moon v-else />
              </el-icon>
          </el-button>
        </div>
      </div>
      <!-- 📏 主布局容器 -->
      <div class="main-container">
      
      <!-- 
      🎯 搜索区域：
      💡 功能：提供图书搜索功能
      🔧 组件：输入框 + 搜索按钮 + 测试按钮
      📝 特点：支持回车键搜索
      -->
      <div class="search-section">
        <!-- 🔍 搜索输入框区域 -->
        <div class="search-input-wrapper">
          <el-input
            v-model="searchVal"
            placeholder="请输入图书名称搜索"
            @keyup.enter="enterSearch"
            clearable
            size="default"
            class="search-input"
          />
        </div>
        
        <!-- 🔘 按钮组区域 -->
        <div class="button-group">
          <!-- 🔍 搜索按钮 -->
          <el-button 
            type="primary"
            @click="load"
            size="default"
          >
            搜索
          </el-button>
          
          <!-- ➕ 新增按钮 -->
          <el-button 
            type="success"
            @click="addNew"
            size="default"
          >
            新增
          </el-button>
          
          <!-- 🏠 回到主页按钮 -->
          <el-button 
            type="warning"
            @click="goHome"
            size="default"
            title="回到主页，清空搜索条件"
          >
            回到主页
          </el-button>
          
          <!-- 🧪 代理测试按钮（开发调试用） -->
          <el-button 
            type="info"
            @click="testProxy"
            size="small"
            title="测试前后端连接"
          >
            测试连接
          </el-button>
        </div>
      </div>
      
      <!-- 
      📋 数据表格区域：
      💡 功能：显示图书列表数据
      🔧 组件：Element Plus Table组件
      📝 特点：支持排序、行选择、操作列
      📊 数据源：tableData（响应式数组）
      -->
      <div class="table-section">
        <el-table 
          :data="tableData"
          stripe
          border
          style="width: 100%"
          :max-height="600"
          :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
          v-loading="false"
          element-loading-text="加载中..."
          element-loading-spinner="el-icon-loading"
        >
          <!-- 
          🔢 序号列：
          💡 功能：显示行号
          🎨 样式：居中显示，宽度80px
          📝 特点：固定在表格左侧
          -->
          <el-table-column 
            type="index"
            label="序号"
            width="80"
            align="center"
            fixed="left"
          />
          
          <!-- 
          📚 图书名称列：
          💡 功能：显示图书的标题
          🔧 属性：prop指定数据字段
          🎨 样式：左对齐，最小宽度150px
          📝 数据：row.book_name
          -->
          <el-table-column 
            prop="book_name"
            label="图书名称"
            min-width="150"
            align="left"
            show-overflow-tooltip
          />
          
          <!-- 
          👤 作者列：
          💡 功能：显示图书作者信息
          🔧 属性：prop指定数据字段
          📝 数据：row.author
          -->
          <el-table-column 
            prop="author"
            label="作者"
            width="120"
            align="center"
            show-overflow-tooltip
          />
          
          <!-- 
          📂 图书类型列：
          💡 功能：显示图书分类信息
          🔧 属性：prop指定数据字段
          📝 数据：row.book_type
          -->
          <el-table-column 
            prop="book_type"
            label="图书类型"
            width="120"
            align="center"
            show-overflow-tooltip
          />
          
          <!-- 
          📝 备注列：
          💡 功能：显示图书备注信息
          🔧 属性：prop指定数据字段
          📝 数据：row.remarks
          -->
          <el-table-column 
            prop="remarks"
            label="备注"
            min-width="200"
            align="left"
            show-overflow-tooltip
          />
          
          <!-- 
          ⚙️ 操作列：
          💡 功能：提供编辑和删除操作
          🔧 特点：固定在表格右侧
          🎨 样式：居中显示，宽度150px
          📝 功能：编辑/删除按钮
          -->
          <el-table-column 
            label="操作"
            width="150"
            align="center"
            fixed="right"
          >
            <!-- 
            ✏️ 编辑按钮：
            💡 功能：编辑当前行数据
            🎨 样式：蓝色主按钮
            🔧 事件：@click="handleEdit(index, row)"
            -->
            <template #default="scope">
              <el-button 
                type="primary"
                size="small"
                @click="handleEdit(scope.$index, scope.row)"
                text
              >
                编辑
              </el-button>
              
              <!-- 
              🗑️ 删除按钮区域：
              💡 功能：删除当前行图书数据
              🎨 样式：红色危险按钮
              🔧 事件：@click="handleDelete(scope.$index, scope.row)"
              ⚠️ 特点：带确认提示
              -->
              <el-button 
                type="danger"
                size="small"
                @click="handleDelete(scope.$index, scope.row)"
                text
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 
      📄 分页控件区域：
      💡 功能：实现数据分页导航
      🔧 组件：Element Plus Pagination
      📊 数据：pagination对象
      ⚡ 特点：支持页码跳转、每页数量设置
      -->
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[5, 10, 20, 50]"
          :total="pagination.total"
          :small="false"
          :disabled="false"
          :background="true"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
          :hide-on-single-page="false"
        />
        
        <!-- 
        📊 分页信息显示：
        💡 功能：显示当前页的记录范围
        📝 格式：如"第 1-10 条，共 100 条"
        🎨 样式：居中对齐
        -->
        <div class="pagination-info">
          <span>
            第 {{ pagination.from || 0 }}-{{ pagination.to || 0 }} 条，
            共 {{ pagination.total || 0 }} 条
          </span>
        </div>
      </div>
      
      <!-- 
      💬 新增/编辑对话框：
      💡 功能：图书的新增和编辑界面
      🔧 组件：addBook.vue子组件
      📝 特点：模态对话框，支持关闭和成功回调
      🎯 数据：info对象（编辑时传递）
      🔄 状态：使用独立的isShowAdd和isShowEdit状态
      -->
      <BookFormDialog
        :isShow="isShowAdd || isShowEdit"
        :info="info"
        @closeAdd="closeAdd" 
        @success="success"
      />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 
🎨 样式定义说明：
💡 作用：控制主页面布局和组件外观
📱 响应式：支持不同屏幕尺寸
🔧 特点：scoped样式，仅作用于当前组件
*/

/* 🌐 全局HTML和body样式设置，确保页面占满整个视口 */
:global(html), :global(body) {
  height: 100%;
  margin: 0;
  padding: 0;
}

/* 📱 主应用容器样式，实现上下居中布局 */
:global(#app) {
  min-height: 100vh;              /* 📏 确保容器至少占满整个视口高度 */
  width: 100%;                    /* 📏 占满整个屏幕宽度 */
  display: flex;
  flex-direction: column;
  justify-content: center;        /* 🎯 垂直居中 */
  /* align-items: center; */       /* 移除水平居中，允许内容完全展开 */
  padding: 5px 0;                /* 📏 减少上下边距，优化垂直空间 */
  background-color: #ffffff;      /* ⚪ 白天模式背景色 */
  transition: background-color 0.3s ease;
}

/* 🌙 夜间模式下的#app容器样式 */
:global(.dark-theme #app) {
  background-color: #1a1a1a;      /* ⚫ 夜间模式背景色，与body保持一致 */
}

/* 
📏 主容器样式：
💡 功能：设置页面主体布局
📐 属性：宽度居中，水平居中对齐
📏 单位：百分比宽度，自适应屏幕
🎯 位置：垂直居中布局，响应式调整
*/

.main {
  width: 100%;                     /* 📏 容器宽度调整为100%以提供更宽的显示空间 */
  max-width: 1200px;              /* 📏 最大宽度限制增加到1600px */
  margin: 10px auto;              /* 📍 水平居中，减少垂直外边距 */
  background-color: #ffffff;      /* ⚪ 白天模式下的容器背景 */
  transition: background-color 0.3s ease;
  padding: 15px 20px;             /* 📏 减少垂直内边距，保持水平内边距 */
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  box-sizing: border-box;         /* 📐 确保padding不影响宽度计算 */
}

/* 🌙 夜间模式下的主容器样式 */
:global(.dark-theme) .main {
  background-color: #2d2d2d;      /* ⚫ 夜间模式下的容器背景 */
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}

/* 
🏠 主布局容器样式：
💡 功能：控制内部容器的布局和间距，让所有内容居中显示
📏 属性：垂直间距32px确保各区域之间有合适距离
📐 布局：整体居中对齐，最大宽度限制
🎨 效果：让各个部分协调分布，居中对齐
*/

.main-container {
  max-width: 1920px;             /* 📏 增加容器最大宽度，增大红色框内内容宽度 */
  margin: 0 auto;                /* 📍 容器整体居中对齐 */
  padding: 0 20px;               /* 📏 左右内边距，增加居中的视觉效果 */
}

/* 
🔍 搜索区域样式：
💡 功能：让搜索区域内容居中显示
🎯 位置：距离页面顶部有适当间距
📐 布局：垂直排列，水平居中
*/

.search-section {
  margin-top: 40px;              /* 📏 搜索框上方距离，让布局更美观 */
  margin-bottom: 32px;           /* 📏 与表格区域的间距 */
  text-align: center;            /* 🎯 内容居中对齐 */
}

/* 
📝 搜索输入框容器样式：
💡 功能：控制搜索输入框的布局和宽度
🎯 位置：居中对齐，合适宽度
*/

.search-input-wrapper {
  margin-bottom: 16px;           /* 📏 输入框与按钮组的间距 */
}

.search-input {
  max-width: 400px;              /* 📝 搜索框最大宽度 */
  width: 100%;                   /* 📐 自适应容器宽度 */
}

/* 📝 搜索框样式：
💡 功能：美化搜索输入框
🎨 样式：圆角边框，轻微阴影
📝 特点：提升搜索框的视觉吸引力
*/

.search-section .el-input__wrapper {
  border-radius: 20px;      /* 📐 圆角边框 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* 🌑 轻微阴影 */
  background-color: #ffffff; /* ⚪ 白色背景 */
  transition: background-color 0.3s ease;
}

/* 🌙 夜间模式下的搜索框样式 */
:global(.dark-theme) .search-section .el-input__wrapper {
  background-color: #444444; /* ⚫ 深色背景 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); /* 🌑 深色模式下更明显的阴影 */
}

:global(.dark-theme) .search-section .el-input__inner {
  color: #e0e0e0;          /* 📝 浅色文字 */
  background-color: #444444; /* ⚫ 深色背景 */
}

/* 🌙 夜间模式下的按钮样式 */
:global(.dark-theme) .el-button {
  color: #e0e0e0;          /* 📝 浅色文字 */
  background-color: #444444; /* ⚫ 深色背景 */
  border-color: #555555;   /* 📏 深色边框 */
}

:global(.dark-theme) .el-button:hover {
  background-color: #555555; /* 🔵 悬停时的深色背景 */
  border-color: #666666;   /* 📏 悬停时的深色边框 */
}

/* 🌙 夜间模式下的分页控件样式 */
:global(.dark-theme) .pagination-section {
  background-color: #2d2d2d; /* ⚫ 深色背景 */
  color: #e0e0e0;          /* 📝 浅色文字 */
}

:global(.dark-theme) .pagination-info {
  color: #e0e0e0;          /* 📝 浅色文字 */
}

/* 
🔘 按钮组样式：
💡 功能：让按钮组水平排列并紧靠在一起
🎯 布局：居中对齐，合适间距
*/

.button-group {
  display: flex;                 /* 🔧 使用flex布局让按钮水平排列 */
  justify-content: center;       /* 🎯 水平居中对齐 */
  align-items: center;           /* 🎯 垂直居中对齐 */
  gap: 12px;                     /* 📏 按钮之间的间距 */
}

/* 
🔘 按钮组内的按钮样式：
💡 功能：覆盖默认的左外边距，使用新的间距方式
🎨 效果：按钮紧靠在一起但保持合适间距
*/

.button-group .el-button {
  margin-left: 0;                /* 📝 清除默认的左外边距 */
  margin-right: 0;               /* 📝 确保没有右外边距 */
}

/* 
📋 表格区域样式：
💡 功能：让表格区域居中显示，提供更好的视觉效果
🎨 效果：与搜索区域保持一致的对齐方式，居中对齐
*/

.table-section {
  margin-bottom: 32px;           /* 📏 与分页控件的间距 */
  text-align: center;             /* 🎯 让表格内容居中对齐 */
}

/* 
📋 表格容器样式：
💡 功能：设置表格容器居中，并控制最大宽度
📐 布局：居中对齐，最大宽度限制，提供更好的视觉效果
🎨 效果：让表格在大屏幕上不会过宽，保持美观
*/

.table-section .el-table {
  margin: 0 auto;                /* 📍 表格容器居中对齐 */
  max-width: 900px;              /* 📏 表格最大宽度，避免过宽 */
  background-color: #ffffff;     /* ⚪ 白天模式下的白色背景 */
  border: 1px solid #ebeef5;     /* 📏 细边框 */
  border-radius: 4px;            /* 📐 圆角边框 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* 🌑 轻微阴影 */
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

/* 🌙 夜间模式下的表格样式 */
:global(.dark-theme) .table-section .el-table {
  background-color: #333333;     /* ⚫ 深色背景 */
  border: 1px solid #444444;     /* 📏 深色边框 */
  color: #e0e0e0;               /* 📝 浅色文字 */
}

/* 
📊 表格行样式优化：
💡 功能：为表格行添加斑马纹效果，提升可读性
🎨 效果：奇数行和偶数行不同背景色，增强视觉区分度
*/

.table-section .el-table .el-table__body tr {
  background-color: #e8e8e8;     /* 🔲 奇数行背景色（中等灰色） */
}

.table-section .el-table .el-table__body tr:nth-child(even) {
  background-color: #f8f8f8;     /* 🔲 偶数行背景色（很浅灰色） */
}

.table-section .el-table .el-table__body tr:hover {
  background-color: #ecf5ff !important; /* 🔵 悬停行背景色（浅蓝色） */
  transition: background-color 0.3s ease; /* 🎨 平滑过渡效果 */
}

/* 
🎨 表格标题行样式：
💡 功能：为表格标题行添加深色背景，突出显示
🎨 效果：深灰色背景，白色文字，增强视觉层次
*/

.table-section .el-table .el-table__header-wrapper {
  background-color: #4a5568;     /* 🖤 标题行背景色（深灰色） */
  border-radius: 6px 6px 0 0;    /* 🎯 顶部圆角 */
  transition: background-color 0.3s ease;
}

.table-section .el-table .el-table__header-wrapper .el-table__header th {
  background-color: #4a5568;     /* 🖤 标题单元格背景色（深灰色） */
  color: #ffffff;                /* ⚪ 标题文字颜色（白色） */
  font-weight: 600;              /* 📝 标题文字粗细 */
  border-bottom: 2px solid #2d3748; /* 📏 底部边框线 */
  border-right: 1px solid #2d3748;  /* 📏 右侧边框 */
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

.table-section .el-table .el-table__header-wrapper .el-table__header th .cell {
  color: #ffffff;                /* ⚪ 标题文字颜色（白色） */
  font-weight: 600;              /* 📝 标题文字粗细 */
  transition: color 0.3s ease;
}

/* 🌙 夜间模式下的表格头部样式优化 */
:global(.dark-theme) .table-section .el-table .el-table__header-wrapper {
  background-color: #333333;     /* ⚫ 深色模式下的更深背景 */
}

:global(.dark-theme) .table-section .el-table .el-table__header-wrapper .el-table__header th {
  background-color: #333333;     /* ⚫ 深色模式下的更深背景 */
  border-bottom: 2px solid #1a1a1a; /* 📏 深色底部边框 */
  border-right: 1px solid #1a1a1a;  /* 📏 深色右侧边框 */
}

/* 🌙 夜间模式下的表格单元格样式 */
:global(.dark-theme) .table-section .el-table .el-table__body td {
  border-bottom: 1px solid #444444; /* 📏 深色单元格底部边框 */
  border-right: 1px solid #444444;  /* 📏 深色单元格右侧边框 */
  color: #e0e0e0;                /* 📝 浅色文字 */
  transition: border-color 0.3s ease, color 0.3s ease;
}

:global(.dark-theme) .table-section .el-table .el-table__body tr:hover {
  background-color: #404040 !important; /* 🔵 夜间模式下的悬停背景色 */
}

/* 
📄 分页控件样式：
💡 功能：让分页区域居中显示，提供更好的视觉效果
🎯 布局：与搜索和表格区域保持一致，居中对齐
*/

.pagination-section {
  text-align: center;            /* 🎯 分页信息居中对齐 */
  margin-top: 20px;              /* 📏 与表格区域的间距 */
  padding: 20px 0;               /* 📏 上下内边距 */
}

/* 
📄 分页组件容器样式：
💡 功能：让分页控件本身居中显示
📐 布局：使用flex布局实现完美的居中对齐
🎨 效果：分页控件在小屏幕上自适应居中
*/

.pagination-section .el-pagination {
  justify-content: center;       /* 🎯 分页控件内容居中对齐 */
  margin-bottom: 16px;           /* 📏 与分页信息的间距 */
}

/* 
📊 分页信息样式：
💡 功能：让分页信息文字居中显示
🎨 效果：提供清晰的数据统计信息，居中对齐
*/

.pagination-info {
  text-align: center;            /* 🎯 分页信息居中对齐 */
  font-size: 14px;               /* 📝 适中的字体大小 */
  color: #606266;                /* 🎨 文字颜色 */
  margin-top: 8px;               /* 📏 与分页控件的间距 */
}

/* 
🔘 按钮样式调整：
💡 功能：统一调整按钮之间的间距
📏 属性：左外边距12px
🎨 效果：让按钮之间有合适的间距
*/

.el-button {
  margin-left: 12px;              /* 📏 按钮左侧间距12px */
}

/* 
🗑️ 删除确认对话框样式：
💡 功能：美化删除确认对话框，提升用户警示效果
🎨 特点：醒目的警告色彩，增强视觉冲击力
📝 用途：让用户更清楚地意识到删除操作的严肃性
*/

:global(.delete-confirm-dialog) {
  /* 💬 对话框内容样式 */
  .el-message-box__content {
    padding: 20px 24px;          /* 📏 增加内边距，让内容更舒适 */
    font-size: 14px;             /* 📝 适中的字体大小 */
    line-height: 1.5;            /* 📏 行高，提升可读性 */
  }
  
  /* 💬 消息文本样式 */
  .el-message-box__message {
    color: #303133;              /* 🎨 深灰色文字，增强可读性 */
    text-align: left;            /* 📝 左对齐，符合中文阅读习惯 */
  }
  
  /* ⚠️ 警告图标样式 */
  .el-message-box__status.el-icon-warning {
    color: #f56c6c;              /* 🔴 红色警告图标，突出危险操作 */
    font-size: 20px;             /* 📏 适当放大图标 */
  }
  
  /* 🔘 按钮样式优化 */
  .el-message-box__btns {
    padding: 15px 24px 20px;     /* 📏 按钮区域内边距 */
    
    /* 🗑️ 删除按钮（红色警告样式）*/
    .el-button--primary {
      background-color: #f56c6c; /* 🔴 红色背景 */
      border-color: #f56c6c;     /* 🔴 红色边框 */
      color: white;              /* ⚪ 白色文字 */
      font-weight: 500;          /* 📝 中等字重 */
    }
    
    .el-button--primary:hover {
      background-color: #f78989; /* 🔴 悬停时稍浅的红色 */
      border-color: #f78989;     /* 🔴 悬停时稍浅的红色边框 */
    }
    
    /* ❌ 取消按钮 */
    .el-button {
      font-weight: 400;          /* 📝 正常字重 */
    }
  }
}

/* 
📱 响应式设计：
💡 功能：在小屏幕上调整布局
📏 调整：容器宽度和内边距适配移动设备
*/

@media (max-width: 768px) {
  :global(#app) {
    padding: 10px 0;               /* 减小移动设备上的上下边距 */
  }
  
  .main {
    width: 95%;                   /* 移动设备上容器宽度95% */
    margin: 0 auto;
    padding: 15px;
    box-shadow: 0 1px 8px rgba(0, 0, 0, 0.1);
  }
  
  .main-container {
    padding: 0 10px;              /* 减小左右内边距 */
  }
  
  /* 📱 移动端删除对话框优化 */
  :global(.delete-confirm-dialog) {
    width: 90%;                   /* 移动端对话框宽度90% */
    max-width: none;              /* 移除最大宽度限制 */
    
    .el-message-box__content {
      padding: 16px 20px;         /* 减小移动端内边距 */
      font-size: 13px;            /* 移动端字体稍小 */
    }
    
    .el-message-box__btns {
      padding: 12px 20px 16px;    /* 移动端按钮区域内边距 */
    }
  }
}

/* 📝 页面标题区域样式 */
.header-container {
  position: relative;
  margin-bottom: 20px;
  padding-bottom: 10px;
  padding-right: 80px; /* 为登出按钮留出空间 */
  padding-left: 20px; /* 调整左侧内边距，让标题居中 */
  border-bottom: 1px solid #e0e0e0;
}

/* 🌓 夜间模式下的标题区域样式 */
:global(.dark-theme) .header-container {
  border-bottom: 1px solid #444444;
}

/* 🧑‍💼 用户信息样式 */
.user-info {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 📝 欢迎文本样式 */
.welcome-text {
  font-size: 16px;
  color: #606266;
  font-weight: 500;
}

/* 🌙 夜间模式下的欢迎文本 */
:global(.dark-theme) .welcome-text {
  color: #e0e0e0;
}

/* 🌓 主题切换按钮样式 */
.theme-toggle {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000; /* 确保按钮始终可见 */
}

.theme-toggle .el-button {
  color: #606266; /* 按钮默认颜色 */
  transition: color 0.3s ease;
  margin-left: 0; /* 覆盖全局按钮边距 */
}

.theme-toggle .el-button:hover {
  color: #409eff; /* 鼠标悬停颜色 */
  background-color: rgba(64, 158, 255, 0.1); /* 悬停背景色 */
}

/* 🌓 日/夜间模式全局样式 */

/* 🌞 白天模式 - 默认状态 */
:global(body) {
  background-color: #ffffff; /* ⚪ 白色背景 */
  color: #303133; /* 📝 深灰色文字 */
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* 🌙 夜间模式 - 当dark-theme类被添加时激活 */
:global(.dark-theme body) {
  background-color: #1a1a1a; /* ⚫ 深色背景 */
  color: #e0e0e0; /* 📝 浅灰色文字 */
}
</style>