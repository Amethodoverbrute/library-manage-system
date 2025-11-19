<template>
  <!-- 
  💬 新增/编辑图书对话框：
  💡 作用：提供图书信息的新增和编辑功能
  🔧 特点：模态对话框，支持拖拽，禁用点击背景关闭
  📱 响应式：宽度自适应，默认为视窗宽度的30%
  -->
  <div>
    
    <!-- 
    📋 Element Plus对话框组件：
    💡 功能：创建模态对话框用于图书信息输入
    🔧 属性：model-value控制显示状态，title设置标题
    ⚙️ 特性：支持拖拽、禁用点击背景关闭
    -->
    <el-dialog
      :model-value="isShow"
      title="图书信息"
      width="30%"
      draggable
      :close-on-click-modal="false"
      destroy-on-close
      @keydown.enter="handleEnterKey"
      @update:modelValue="handleModelValueChange"
      @close="$emit('close')"
    >
      
      <!-- 
      📝 表单区域：
      💡 作用：收集用户输入的图书信息
      🔧 组件：Element Plus Form表单组件
      📋 数据：form对象绑定到表单字段
      ⚠️ 规则：包含必填验证和长度限制
      -->
      <el-form
        :model="form"
        label-width="80px"
        ref="ruleFormRef"
        :rules="rules"
      >
        
        <!-- 
        📚 书名输入项：
        💡 必填字段，用于存储图书标题
        ⚠️ 验证：不能为空，长度2-256字符
        -->
        <el-form-item label="书名" prop="book_name">
          <el-input 
            v-model="form.book_name"
            placeholder="请输入书名"
          />
        </el-form-item>

        <!-- 
        👤 作者输入项：
        💡 必填字段，用于存储图书作者信息
        ⚠️ 验证：不能为空，长度2-128字符
        -->
        <el-form-item label="作者" prop="author">
          <el-input 
            v-model="form.author"
            placeholder="请输入作者"
          />
        </el-form-item>

        <!-- 
        📂 图书类别输入项：
        💡 必填字段，用于存储图书分类信息
        ⚠️ 验证：不能为空
        -->
        <el-form-item label="图书类别" prop="book_type">
          <el-input 
            v-model="form.book_type"
            placeholder="请输入图书类别"
          />
        </el-form-item>

        <!-- 
        📝 备注输入项：
        💡 可选字段，用于存储图书备注信息
        🔧 特点：多行文本框（textarea），2行高度
        📝 用途：存放图书的额外说明信息
        -->
        <el-form-item label="备注" prop="remarks">
          <el-input
            v-model="form.remarks"
            placeholder="请输入备注信息"
            type="textarea"
            :rows="2"
          />
        </el-form-item>
      </el-form>

      <!-- 
      📋 对话框底部按钮区域：
      💡 功能：提供取消和确认操作按钮
      🎨 样式：右对齐布局
      🔧 事件：点击按钮触发相应操作
      -->
      <template #footer>
        <span class="dialog-footer">
          
          <!-- ❌ 取消按钮：关闭对话框，不保存数据 -->
          <el-button @click="closeAdd(ruleFormRef)">取消</el-button>
          
          <!-- ✅ 确认按钮：验证并保存表单数据 -->
          <el-button type="primary" @click="save()">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
/* 
📦 Vue 3 Composition API 导入：
💡 作用：提供响应式状态管理和组件逻辑
🔧 功能：ref(响应式数据)、computed(计算属性)、reactive(响应式对象)、watch(监听器)
⚡ 特点：TypeScript类型支持，编译时优化
*/

import { ref, computed, reactive, watch } from "vue";

/* 
🔗 Element Plus 类型导入：
💡 作用：为UI组件提供TypeScript类型支持
🔧 类型：FormInstance(表单实例)、FormRules(验证规则)
📝 用途：确保表单验证和组件类型安全
*/

import { FormInstance, FormRules } from "element-plus";

/* 
🌐 HTTP接口方法导入：
💡 作用：从HTTP模块导入新增和编辑API方法
🔧 功能：add(新增图书)、edit(编辑图书)
📁 路径：../http/index（相对于当前文件的位置）
*/

import { add, edit } from "../http/index";

/* 
🎯 组件属性定义：
💡 作用：定义组件接收的外部参数
🔧 功能：通过props从父组件传递数据
📋 类型：TypeScript接口定义，明确参数类型
*/

const props = defineProps({
  /* 
  🔄 对话框显示状态：
  💡 类型：布尔值
  📝 作用：控制addBook对话框的显示/隐藏
  🎯 来源：父组件App.vue传递
  */
  isShow: Boolean,
  
  /* 
  📋 图书编辑数据：
  💡 类型：对象，默认空对象
  📝 作用：编辑时传递图书信息，新增时为空对象
  📊 内容：包含id、book_name、author、book_type、remarks等字段
  🎯 来源：父组件App.vue传递的当前行数据
  */
  info: {
    type: Object,
    default: () => ({}),
  },
});

/* 
🎛️ 表单数据状态：
💡 作用：存储表单中的图书信息
🔧 功能：双向绑定到表单输入项
📋 类型：reactive对象，包含所有表单字段
⚡ 特点：数据变更自动更新表单显示
*/

const form = ref({
  id: 0,
  book_name: "",
  author: "",
  book_type: "",
  remarks: "",
});

/* 
📝 表单引用定义：
💡 作用：获取Element Plus表单组件的实例
🔧 功能：用于表单验证、重置等操作
📋 类型：FormInstance类型，确保方法调用安全
⚡ 特点：通过ref()创建，组件渲染后可用
*/

const ruleFormRef = ref();

/* 
⚠️ 表单验证规则：
💡 作用：定义每个字段的验证条件和错误提示
🔧 类型：FormRules类型，Element Plus内置验证规则
📋 规则：必填验证、长度限制、自定义提示
*/

const rules = reactive<FormRules>({
  
  /* 
  📚 书名验证规则：
  💡 规则：必填 + 长度限制
  ⚠️ 条件：不能为空，长度2-256字符
  🔧 触发：blur（失去焦点）时验证
  */
  book_name: [
    { required: true, message: "书名不能为空", trigger: "blur" },
    { min: 2, max: 256, message: "书名长度需在2-256字符", trigger: "blur" },
  ],
  
  /* 
  👤 作者验证规则：
  💡 规则：必填 + 长度限制
  ⚠️ 条件：不能为空，长度2-128字符
  🔧 触发：blur（失去焦点）时验证
  */
  author: [
    { required: true, message: "作者不能为空", trigger: "blur" },
    { min: 2, max: 128, message: "作者长度需在2-128字符", trigger: "blur" },
  ],
  
  /* 
  📂 图书类别验证规则：
  💡 规则：必填验证
  ⚠️ 条件：不能为空
  🔧 触发：blur（失去焦点）时验证
  */
  book_type: [
    { required: true, message: "图书类别不能为空", trigger: "blur" },
  ],
});

/* 
👁️ 数据监听器：
💡 作用：监听父组件传递的info数据变化
🔧 功能：当info改变时，自动更新表单数据
📝 应用：编辑模式下自动填充表单字段
⚡ 特点：immediate: true确保组件挂载时立即执行
*/

watch(
  () => props.info,
  (newInfo) => {
    if (newInfo) {
      /* 
      🔢 ID类型转换：
      💡 作用：将字符串ID转换为数字类型
      🔧 原因：避免字符串"0"和数字0的判断问题
      📝 示例："123" → 123, undefined → 0
      */
      const id = newInfo.id ? Number(newInfo.id) : 0;

      /* 
      📊 表单数据填充：
      💡 作用：将父组件传来的数据填充到表单中
      🔧 功能：设置默认值，防止undefined导致的错误
      📝 兼容性：只使用统一的字段名，避免混乱
      */
      form.value = {
        id: id,                                            // 📊 设置转换后的ID
        book_name: newInfo.book_name || newInfo.bookname || "", // 📚 图书名称，支持多种字段名
        author: newInfo.author || "",                      // 👤 作者信息，默认空字符串
        book_type: newInfo.book_type || newInfo.type || "", // 📂 图书类别，兼容多种字段名
        remarks: newInfo.remarks || "",                    // 📝 备注信息，默认空字符串
      };
    } else {
      /* 
      🔄 重置表单：
      💡 作用：当没有信息时，清空表单数据
      📝 应用：新增模式或清除编辑数据
      */
      form.value = {
        id: 0,
        book_name: "",
        author: "",
        book_type: "",
        remarks: "",
      };
    }
  },
  { immediate: true } // 🚀 立即执行一次，确保初始状态正确
);

/* 
📢 事件发射定义：
💡 作用：定义组件向父组件发送的事件
🔧 功能：通知父组件对话框关闭或操作成功
📋 类型：字符串数组，指定事件名称
*/

const emits = defineEmits(["closeAdd", "success"]);

/* 
⌨️ 处理回车键事件：
💡 作用：当用户在对话框中按下回车键时触发确认操作
🔧 功能：调用save函数，相当于点击确认按钮
📝 特点：只处理回车键，避免干扰其他按键操作
*/

const handleEnterKey = () => {
  save();
};

/* 
🔄 处理对话框显示状态变化：
💡 作用：监听对话框model-value的变化
🔧 功能：当用户点击X号或ESC键关闭时，通过update:modelValue通知父组件
📝 特点：确保父组件的isShowAdd/isShowEdit状态能够正确更新
*/

const handleModelValueChange = (value: boolean) => {
  if (!value) {
    // 对话框即将关闭，重置表单状态
    if (ruleFormRef.value) {
      ruleFormRef.value.resetFields();
    }
    form.value = {
      id: 0,
      book_name: "",
      author: "",
      book_type: "",
      remarks: "",
    };
    
    // 通知父组件关闭状态
    emits("closeAdd");
  }
};

/* 
❌ 关闭对话框函数：
💡 作用：处理取消操作和表单重置
🔧 功能：1. 重置表单字段
         2. 清空表单数据  
         3. 发射关闭事件给父组件
📝 参数：formEl - 表单实例，用于重置验证状态
⚡ 特点：先验证表单实例是否存在，避免空指针错误
*/

const closeAdd = (formEl: FormInstance | undefined) => {
  if (!formEl) return; // 🔍 安全检查：表单实例不存在则直接返回
  
  // 🔄 重置表单字段并清空数据
  formEl.resetFields();  // 重置表单验证状态
  form.value = {         // 清空表单数据
    id: 0,
    book_name: "",
    author: "",
    book_type: "",
    remarks: "",
  };
  
  emits("closeAdd"); // 📢 通知父组件关闭对话框
};

/* 
✅ 保存表单函数：
💡 作用：处理表单验证和数据提交
🔧 流程：1. 验证表单数据
         2. 判断新增/编辑模式
         3. 调用相应API接口
         4. 处理成功/失败结果
📝 参数：无（使用内部表单引用）
⚡ 特点：async/await异步处理，try/catch错误处理
*/

const save = async () => {
  if (!ruleFormRef.value) return; // 🔍 安全检查：表单引用不存在则返回

  try {
    /* 
    📋 表单验证：
    💡 作用：验证表单数据是否符合规则
    🔧 方法：使用Promise方式异步验证
    📝 结果：返回布尔值，true表示验证通过
    */
    const valid = await ruleFormRef.value.validate();

    if (valid) {
      /* 
      🔢 ID类型转换：
      💡 作用：确保ID为数字类型
      🔧 原因：避免字符串和数字类型的比较问题
      */
      const id = Number(form.value.id);

      if (id > 0) {
        /* 
        ✏️ 编辑模式：
        💡 条件：ID大于0表示编辑已有图书
        🔧 操作：调用edit接口更新图书信息
        📊 数据：传递包含ID的完整表单数据
        */
        const res = await edit(form.value);
        if (res.data) {
          emits("success", "修改成功！"); // 📢 通知父组件编辑成功
        }
      } else {
        /* 
        ➕ 新增模式：
        💡 条件：ID等于0表示新增图书
        🔧 操作：调用add接口创建新图书
        📊 数据：传递不包含ID的表单数据
        */
        const res = await add(form.value);
        if (res.data) {
          emits("success", "添加成功！"); // 📢 通知父组件新增成功
        }
      }

      // 🔄 关闭对话框并重置表单
      closeAdd();
    }
  } catch (error) {
    /* 
    💥 错误处理：
    💡 作用：捕获表单验证或API调用错误
    📝 示例：验证失败、网络错误、数据格式错误
    🔧 处理：记录错误日志，可添加用户提示
    */
    console.error("表单验证失败:", error);
    // 可在此处添加用户错误提示，如ElMessage.error()
  }
};
</script>

<style scoped>
/* 
🎨 组件样式定义：
💡 作用：控制对话框组件的视觉效果
🔧 特点：scoped样式，仅作用于当前组件
📱 响应式：支持不同屏幕尺寸的显示
*/

/* 
📋 对话框头部样式：
💡 功能：优化对话框标题栏的外观
🎨 样式：添加底部边框，区分头部和内容区域
📏 间距：设置合适的内边距
*/

.el-dialog__header {
  padding: 16px 20px;            /* 📏 头部内边距：上下16px，左右20px */
  border-bottom: 1px solid #ebeef5; /* 🎨 底部边框：1px宽度，浅灰色 */
}

/* 
📝 对话框内容区域样式：
💡 功能：优化表单内容的显示效果
📏 间距：设置合适的内边距，让内容不拥挤
🎨 布局：确保内容区域有足够的空间
*/

.el-dialog__body {
  padding: 20px;                 /* 📏 内容区内边距：20px四周 */
}
</style>