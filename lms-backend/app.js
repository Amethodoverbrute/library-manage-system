/**
 * 🏛️ 图书馆管理系统后端服务 (LMS Backend)
 * 📚 主要功能：提供图书CRUD、搜索分页、跨域支持
 * 💻 技术栈：Node.js + Express + MySQL2 + CORS
 * 🚀 端口：8000
 * 
 * 功能模块：
 * 1. CORS跨域配置 - 支持前端开发环境访问
 * 2. 中间件配置 - 处理请求数据格式
 * 3. 数据库连接池 - 复用数据库连接，提升性能
 * 4. 图书管理API - 增删改查操作
 * 5. 搜索分页功能 - 优化大量数据查询
 * 6. 安全编程实践 - 参数化查询防SQL注入
 */

const express = require("express");          // 🚀 Express框架 - 快速构建HTTP服务器
const mysql = require("mysql2");             // 🗄️ MySQL2驱动 - 连接MySQL数据库
const configs = require("./config");         // ⚙️ 配置文件 - 数据库连接参数
const bodyParser = require("body-parser");   // 📦 数据解析器 - 解析POST请求数据
const cors = require("cors");               // 🌐 跨域支持 - 解决 前后端分离 跨域问题
const bcrypt = require('bcrypt');             // 🔒 密码加密库 - 安全存储用户密码
const jwt = require('jsonwebtoken');          // 🔐 JWT令牌库 - 用户认证和授权
const jwtConfig = require('./jwt.config');    // 🔧 JWT配置 - 密钥和过期时间等

// 🚀 创建Express应用实例
const app = express();

// 🔌 服务器监听端口
const port = 8000; 

// =============================================================================
// ✅ 模块1: CORS跨域配置
// 解决前端(8080端口)访问后端(8000端口)的跨域问题
// =============================================================================
app.use(cors({
  // 🌐 允许访问的来源域名列表
  origin: [
    'http://localhost:8080',  // Vite开发服务器
    'http://127.0.0.1:8080', // Vite开发服务器备用地址
    'http://localhost:8081',  // Vite开发服务器备用端口
    'http://127.0.0.1:8081', // Vite开发服务器备用地址和端口
    'http://localhost:3000',  // 常见开发端口
  ],
  credentials: true,  // 🔑 是否允许发送Cookie等凭证
  
  // 🔧 允许的HTTP方法 (更新：支持DELETE用于RESTful删除操作)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
  
  // 📋 允许的请求头字段
  allowedHeaders: ['Content-Type', 'Authorization'], 
}));

// =============================================================================
// ✅ 模块2: 中间件配置
// 处理请求数据格式，支持JSON和URL编码
// =============================================================================
app.use(bodyParser.urlencoded({ extended: true })); // 🔧 解析URL编码的请求体
app.use(bodyParser.json()); // 🔧 解析JSON格式的请求体

// =============================================================================
// ✅ 模块3: 数据库连接池配置
// 创建可复用的数据库连接，提升性能，防止连接泄漏
// =============================================================================
const pool = mysql.createPool({
  host: 'localhost',      // 📍 数据库主机地址
  user: 'root',      // 👤 数据库用户名
  password: '973100',  // 🔑 数据库密码
  database: 'amob_lms',  // 🗄️ 数据库名称
  waitForConnections: true,   // ⏳ 连接不足时是否等待
  connectionLimit: 10,        // 🔄 最大连接数
  queueLimit: 0,              // 📋 连接队列长度（0表示无限）
});

// =============================================================================
// ✅ 模块4: JWT验证中间件
// 验证用户的JWT令牌，确保API访问的安全性
// =============================================================================
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: '未提供认证令牌'
    });
  }
  
  // 提取Bearer令牌
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: '令牌格式错误'
    });
  }
  
  try {
    // 验证令牌
    const decoded = jwt.verify(token, jwtConfig.secret);
    // 将用户信息存储在请求对象中
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '无效或过期的令牌'
    });
  }
};

// =============================================================================
// ✅ 模块5: 用户注册API
// 处理新用户的注册请求，包括密码加密
// =============================================================================
app.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    // 验证输入 - email改为可选
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码为必填项'
      });
    }
    
    // 如果提供了email，进行格式验证
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: '请输入有效的邮箱地址'
      });
    }
    
    // 检查用户名是否已存在
    const checkUsernameSql = 'SELECT * FROM users WHERE username = ?';
    const [existingUsers] = await pool.promise().query(checkUsernameSql, [username]);
    
    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }
    
    // 如果提供了邮箱，检查是否已存在
    if (email) {
      const checkEmailSql = 'SELECT * FROM users WHERE email = ?';
      const [existingEmails] = await pool.promise().query(checkEmailSql, [email]);
      
      if (Array.isArray(existingEmails) && existingEmails.length > 0) {
        return res.status(400).json({
          success: false,
          message: '邮箱已被注册'
        });
      }
    }
    
    // 生成密码哈希
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 插入新用户 - 根据是否提供email动态构建SQL
    let insertUserSql, params;
    if (email) {
      insertUserSql = 'INSERT INTO users (username, password, email, created_at) VALUES (?, ?, ?, NOW())';
      params = [username, hashedPassword, email];
    } else {
      insertUserSql = 'INSERT INTO users (username, password, created_at) VALUES (?, ?, NOW())';
      params = [username, hashedPassword];
    }
    
    const [result] = await pool.promise().query(insertUserSql, params);
    
    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user_id: result.insertId,
        username,
        email
      }
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，注册失败'
    });
  }
});

// =============================================================================
// ✅ 模块6: 用户登录API
// 处理用户登录请求，验证凭证并生成JWT令牌
// =============================================================================
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 验证输入
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '请输入用户名和密码'
      });
    }
    
    // 查询用户
    const getUserSql = 'SELECT * FROM users WHERE username = ?';
    const [users] = await pool.promise().query(getUserSql, [username]);
    
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    const user = users[0];
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    // 创建JWT令牌
    const token = jwt.sign(
      {
        user_id: user.id,
        username: user.username,
        email: user.email
      },
      jwtConfig.secret,
      {
        expiresIn: jwtConfig.expiresIn
      }
    );
    
    // 更新最后登录时间（我们的表没有last_login字段，跳过）
    // const updateLoginSql = 'UPDATE users SET last_login = NOW() WHERE id = ?';
    // await pool.promise().query(updateLoginSql, [user.id]);
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        user_id: user.id,
        username: user.username,
        email: user.email,
        token
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，登录失败'
    });
  }
});

// =============================================================================
// ✅ 模块7: 获取图书列表API (需要认证)
// 查询图书数据，支持搜索和分页
// =============================================================================
app.get('/api/test', verifyToken, (req, res) => {
  // 🔍 测试API，用于验证JWT认证是否正常工作
  res.json({
    success: true,
    message: '认证成功，您已登录！',
    user: req.user
  });
});

// =============================================================================
// ✅ 模块8: 获取图书列表API (支持搜索和分页)
// 查询图书数据，支持按书名、作者搜索
// =============================================================================
app.get('/', verifyToken, (req, res) => {
  // 🔍 获取查询参数：搜索关键词、页码、每页数量
  const keyword = req.query.keyword || '';
  const page = parseInt(req.query.page) || 1; // 🔄 页码（默认第1页）
  const limit = parseInt(req.query.limit) || 10; // 📋 每页数量（默认10条）
  const offset = (page - 1) * limit; // 🔢 计算偏移量
  
  // 🔐 获取当前用户ID
  const currentUserId = req.user.user_id;
  
  try {
    // 📊 构建查询SQL (参数化查询防止SQL注入)
    const sql = `
      SELECT 
        b.id, 
        b.book_name, 
        b.author, 
        b.book_type,
        b.remarks,
        b.created_at,
        b.updated_at
      FROM books b
      WHERE 
        b.book_name LIKE ? OR 
        b.author LIKE ?
      ORDER BY b.book_name ASC
      LIMIT ? OFFSET ?
    `;
    
    // 🔍 查询参数（带%的模糊匹配）
    const params = [`%${keyword}%`, `%${keyword}%`, limit, offset];
    
    // 🔄 执行查询
    pool.query(sql, params, (err, results) => {
      if (err) {
        console.error('查询图书失败:', err);
        return res.status(500).json({
          success: false,
          message: '查询失败，请稍后重试'
        });
      }
      
      // 📊 查询总数
      const countSql = `
        SELECT COUNT(*) AS total 
        FROM books 
        WHERE book_name LIKE ? OR author LIKE ?
      `;
      
      pool.query(countSql, [`%${keyword}%`, `%${keyword}%`], (countErr, countResults) => {
        if (countErr) {
          console.error('查询图书总数失败:', countErr);
          return res.status(500).json({
            success: false,
            message: '查询失败，请稍后重试'
          });
        }
        
        const total = countResults[0].total;
        const totalPages = Math.ceil(total / limit);
        
        // 🎯 返回成功响应
        res.json({
          success: true,
          data: results,
          pagination: {
            current: page,
            pageSize: limit,
            total,
            totalPages
          }
        });
      });
    });
  } catch (error) {
    console.error('获取图书列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// =============================================================================
// ✅ 模块9: 获取图书详情API (需要认证)
// 根据ID查询单个图书信息
// =============================================================================
app.get('/get', verifyToken, (req, res) => {
  // 🔍 获取查询参数：图书ID
  const id = req.query.id;
  
  // 🚫 参数验证
  if (!id) {
    return res.status(400).json({
      success: false,
      message: '缺少图书ID参数'
    });
  }
  
  try {
    // 📊 SQL查询 (参数化查询)
    const sql = `
      SELECT 
        b.id, 
        b.book_name, 
        b.author, 
        b.book_type,
        b.remarks,
        b.created_at,
        b.updated_at
      FROM books b
      WHERE b.id = ?
    `;
    
    // 🔄 执行查询
    pool.query(sql, [id], (err, results) => {
      if (err) {
        console.error('查询图书详情失败:', err);
        return res.status(500).json({
          success: false,
          message: '查询失败，请稍后重试'
        });
      }
      
      // 📋 检查结果
      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: '图书不存在'
        });
      }
      
      // 🎯 返回成功响应
      res.json({
        success: true,
        data: results[0]
      });
    });
  } catch (error) {
    console.error('获取图书详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// =============================================================================
// ✅ 模块10: 新增图书API (需要认证)
// 创建新的图书记录
// =============================================================================
app.post('/add', verifyToken, (req, res) => {
  // 🔍 获取请求体数据
  const { book_name, author, book_type, remarks } = req.body;
  
  // 🔐 获取当前用户ID（从token中提取）
  const currentUserId = req.user.user_id;
  
  // 🚫 参数验证
    if (!book_name || !author || !book_type) {
      return res.status(400).json({
        success: false,
        message: '书名、作者和图书类别为必填项'
      });
    }
    
    try {
      // 📊 构建插入SQL
      const sql = `
        INSERT INTO books 
        (book_name, author, book_type, remarks, user_id, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      // 🔄 执行插入
      pool.query(sql, [book_name, author, book_type, remarks || '', currentUserId], (err, result) => {
      if (err) {
        console.error('新增图书失败:', err);
        return res.status(500).json({
          success: false,
          message: '新增失败，请稍后重试'
        });
      }
      
      // 🎯 返回成功响应
      res.json({
        success: true,
        message: '新增成功',
        data: {
          id: result.insertId,
          book_name,
          author,
          book_type,
          remarks
        }
      });
    });
  } catch (error) {
    console.error('新增图书错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// =============================================================================
// ✅ 模块11: 编辑图书API (需要认证)
// 更新现有图书记录
// =============================================================================
app.post('/edit', verifyToken, (req, res) => {
  // 🔍 获取请求体数据
  const { id, book_name, author, book_type, remarks } = req.body;
  
  // 🔐 获取当前用户ID
  const currentUserId = req.user.user_id;
  
  // 🚫 参数验证
  if (!id || !book_name || !author || !book_type) {
    return res.status(400).json({
      success: false,
      message: '图书ID、书名、作者和图书类别为必填项'
    });
  }
  
  try {
    // 🔍 先检查图书是否存在
    const checkSql = 'SELECT id FROM books WHERE id = ?';
    pool.query(checkSql, [id], (checkErr, checkResults) => {
      if (checkErr) {
        console.error('检查图书失败:', checkErr);
        return res.status(500).json({
          success: false,
          message: '操作失败，请稍后重试'
        });
      }
      
      if (checkResults.length === 0) {
        return res.status(404).json({
          success: false,
          message: '图书不存在'
        });
      }
      
      // 📊 构建更新SQL
      const updateSql = `
        UPDATE books 
        SET book_name = ?, author = ?, book_type = ?, remarks = ?, updated_at = NOW() 
        WHERE id = ?
      `;
      
      // 🔄 执行更新
      pool.query(updateSql, [book_name, author, book_type, remarks || '', id], (err) => {
        if (err) {
          console.error('编辑图书失败:', err);
          return res.status(500).json({
            success: false,
            message: '编辑失败，请稍后重试'
          });
        }
        
        // 🎯 返回成功响应
        res.json({
          success: true,
          message: '编辑成功'
        });
      });
    });
  } catch (error) {
    console.error('编辑图书错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// =============================================================================
// ✅ 模块12: 删除图书API (需要认证)
// 删除指定的图书记录
// =============================================================================
app.delete('/delete/:id', verifyToken, (req, res) => {
  // 🔍 获取URL路径参数
  const { id } = req.params;
  
  // 🔐 获取当前用户ID
  const currentUserId = req.user.user_id;
  
  // 🚫 参数验证
  if (!id) {
    return res.status(400).json({
      success: false,
      message: '缺少图书ID参数'
    });
  }
  
  try {
    // 🔍 先检查图书是否存在
    const checkSql = 'SELECT id FROM books WHERE id = ?';
    pool.query(checkSql, [id], (checkErr, checkResults) => {
      if (checkErr) {
        console.error('检查图书失败:', checkErr);
        return res.status(500).json({
          success: false,
          message: '操作失败，请稍后重试'
        });
      }
      
      if (checkResults.length === 0) {
        return res.status(404).json({
          success: false,
          message: '图书不存在'
        });
      }
      
      // 📊 构建删除SQL
      const deleteSql = 'DELETE FROM books WHERE id = ?';
      
      // 🔄 执行删除
      pool.query(deleteSql, [id], (err) => {
        if (err) {
          console.error('删除图书失败:', err);
          return res.status(500).json({
            success: false,
            message: '删除失败，请稍后重试'
          });
        }
        
        // 🎯 返回成功响应
        res.json({
          success: true,
          message: '删除成功'
        });
      });
    });
  } catch (error) {
    console.error('删除图书错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// =============================================================================
// ✅ 模块13: 服务器启动
// 启动HTTP服务器，监听指定端口，开始接收客户端请求
// =============================================================================
app.listen(port, () => {
  // 🚀 服务器启动成功提示
  console.log(`🚀 服务器已启动，端口: ${port}`); 
  console.log(`🔗 后端直接访问地址: http://127.0.0.1:${port}`);
  console.log(`📝 开发环境测试地址: http://127.0.0.1:${port}/test`);
  console.log(`📝 代理测试地址: http://127.0.0.1:${port}/api/test`);
  console.log(`⚡ 代理路径重写: /api/* → /* (Vite代理移除了/api前缀)`);
  console.log(`🌐 前端开发地址: http://localhost:8080 (通过Vite代理访问后端)`);
  
  // 📊 系统信息汇总
  console.log(`📋 服务器配置:`);
  console.log(`   - 端口: ${port}`);
  console.log(`   - CORS: 已启用（支持多个开发端口）`);
  console.log(`   - 数据库: MySQL连接池已创建`);
  console.log(`   - 中间件: bodyParser、CORS已配置`);
  console.log(`   - API接口: GET(/, /get, /test, /api/test) + POST(/add, /edit, /delete)`);
  console.log(`🎉 图书馆管理系统后端服务启动完成！`);
});