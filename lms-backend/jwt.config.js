/**
 * 🔐 JWT配置文件
 * 📝 作用：统一管理JWT相关配置
 * 💡 包含：密钥、过期时间、算法等配置
 */

const jwtConfig = {
    // 🔐 JWT密钥 - 生产环境请使用环境变量并定期更换
    secret: process.env.JWT_SECRET || 'library_manage_system_jwt_secret_key_2024',
    
    // ⏰ JWT过期时间（单位：秒）
    expiresIn: 86400, // 24小时
    
    // 🔧 JWT算法
    algorithm: 'HS256',
    
    // 📋 JWT令牌前缀（用于Authorization请求头）
    tokenPrefix: 'Bearer',
    
    // 🎯 刷新令牌过期时间（单位：秒）
    refreshExpiresIn: 604800, // 7天
};

module.exports = jwtConfig;
