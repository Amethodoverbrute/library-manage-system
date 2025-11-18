/**
 * 🌐 数据库 配置文件
 * 📝 作用：统一管理 数据库连接参数，支持环境变量配置
 * 💡 最佳实践：生产环境使用环境变量，开发环境使用默认值
 */

const configs = {
  // 📊 MySQL数据库配置
  mysql: {
    // 🖥️ 数据库服务器地址
    host: process.env.DB_HOST || "localhost",     // 生产环境：使用环境变量，开发环境：默认localhost
    
    // 👤 数据库用户名  
    user: process.env.DB_USER || "root",          // 生产环境：使用环境变量，开发环境：默认root
    
    // 🔒 数据库密码
    password: process.env.DB_PASSWORD || "973100", // ⚠️ 安全警告：生产环境强烈建议使用环境变量
                                                   // 不要在代码中硬编码敏感信息！生产环境应该：
                                                   // export DB_PASSWORD="your_secure_password"
    
    // 📂 数据库名称
    database: process.env.DB_NAME || "amob_lms",   // 数据库表名，前端查询的books表就在这个数据库中
  },
};

// 📤 导出配置对象，让其他模块通过require('./config')使用
module.exports = configs;

/*
💡 配置说明：
1. 环境变量优先：生产环境部署时，通过环境变量覆盖默认值
2. 默认值友好：开发环境使用常见默认值，快速启动
3. 安全性考虑：生产环境绝对不能在代码中写密码！

🚀 生产环境部署示例：
export DB_HOST="your-db-host.com"
export DB_USER="your-db-user"  
export DB_PASSWORD="your-secure-password"
export DB_NAME="your-database-name"

🔧 使用环境变量的好处：
- 安全性：不在代码中暴露敏感信息
- 灵活性：不同环境使用不同配置
- 维护性：修改配置无需修改代码
*/
