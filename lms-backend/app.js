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
    'http://localhost:3000',  // 常见开发端口
  ],
  credentials: true,  // 🔑 是否允许发送Cookie等凭证
  
  // 🔧 允许的HTTP方法 (更新：支持DELETE用于RESTful删除操作)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
  
  // 📋 允许的请求头字段
  allowedHeaders: ['Content-Type', 'Authorization'], 
  
  // ⚡ 预检请求成功状态码（某些旧版浏览器需要）
  optionsSuccessStatus: 200 
}));

// 🖨️ 打印CORS配置信息（开发调试用）
console.log('🌐 CORS配置完成，允许来源:');
console.log('  - http://localhost:8080 (Vite开发服务器)');
console.log('  - http://127.0.0.1:8080 (备用地址)'); 
console.log('  - http://localhost:3000 (常见开发端口)');

// =============================================================================
// ✅ 模块2: 中间件配置
// 设置数据解析器，处理不同格式的请求数据
// =============================================================================

// 📝 解析application/x-www-form-urlencoded格式数据（表单提交）
app.use(bodyParser.urlencoded({ extended: false })); 

// 🔄 解析application/json格式数据（AJAX请求）
app.use(bodyParser.json()); 

// =============================================================================
// ✅ 模块3: 数据库连接池配置
// 创建连接池，复用数据库连接，避免频繁建立/断开连接
// =============================================================================

// 🔗 从配置文件获取数据库连接参数
const dbConfig = configs.mysql;

// 🌊 创建MySQL连接池
const pool = mysql.createPool(dbConfig); 

// =============================================================================
// ✅ 模块4: 数据库连接测试
// 启动时测试数据库连接，确保服务可用
// =============================================================================
pool.getConnection((err) => {
  if (err) {
    // ❌ 数据库连接失败，记录错误但不中断服务器启动
    console.error("❌ 数据库连接失败:", err);
  } else {
    // ✅ 数据库连接成功
    console.log("✅ 数据库连接成功");
  }
});

// =============================================================================
// ✅ 模块5: 根路由 - 基础测试接口
// 用于验证服务器是否正常启动
// =============================================================================
app.get("/", (req, res) => {
  console.log("✅ 收到测试请求:", req.url);
  res.send("Hello World"); // 返回简单的文本响应
});

// =============================================================================
// ✅ 模块6: 获取图书列表API (带搜索和分页功能)
// 用途：获取图书数据，支持根据书名搜索和分页浏览
// URL: GET /get
// 参数：book_name(可选，搜索关键词)、page(可选，页码，默认1)、pageSize(可选，每页条数，默认10)
// =============================================================================
app.get("/get", (req, res) => {
  // 📝 记录请求信息（开发调试用）
  console.log("📋 收到搜索请求:", req.query);
  console.log("🔍 搜索关键词 book_name:", req.query.book_name || "(未提供)");
  console.log("📄 分页参数:", {
    page: req.query.page || "(默认第1页)",
    pageSize: req.query.pageSize || "(默认10条)"
  });
  
  // 🔗 从连接池获取数据库连接
  pool.getConnection((err, connection) => {
    if (err) {
      // ❌ 数据库连接失败处理
      console.error("❌ 数据库连接错误:", err);
      return res.status(500).json({ 
        error: "数据库连接失败", 
        details: err.message 
      }); 
    }

    // 📊 解析分页参数
    const page = parseInt(req.query.page) || 1;     // 当前页码（从1开始）
    const pageSize = parseInt(req.query.pageSize) || 10; // 每页条数
    const offset = (page - 1) * pageSize;           // 偏移量（跳过前面多少条）
    
    console.log(`📊 分页计算: 第${page}页，每页${pageSize}条，偏移量${offset}`);

    // 🔨 构建SQL查询
    // 用于获取总数量（不包含分页限制）
    let countSql = "SELECT COUNT(*) as total FROM books"; 
    
    // 用于获取分页数据（包含LIMIT限制），按书名A-Z排序
    // 注意：WHERE子句必须在ORDER BY之前！
    let dataSql = "SELECT * FROM books";
    
    // WHERE条件构建
    let whereClause = ""; // 存储WHERE条件
    let params = [];      // 存储SQL参数（防SQL注入）

    // 🔍 搜索功能：根据书名模糊查询
    if (req.query.book_name) {
      // 使用LIKE进行模糊查询，支持包含指定关键词的书名
      whereClause = " WHERE book_name LIKE ?";
      // 添加模糊搜索参数：%关键词%
      params.push(`%${req.query.book_name}%`); 
      console.log("🔍 执行搜索SQL:", dataSql + whereClause + " ORDER BY book_name ASC LIMIT ? OFFSET ?");
      console.log("🔑 搜索参数:", params);
    } else {
      console.log("📋 执行全部查询SQL:", dataSql + " ORDER BY book_name ASC LIMIT ? OFFSET ?");
    }

    // 📏 正确构建数据查询SQL：WHERE -> ORDER BY -> LIMIT -> OFFSET
    dataSql = dataSql + whereClause + " ORDER BY book_name ASC LIMIT ? OFFSET ?";
    
    // 🎯 第一步：查询总数量
    connection.query(countSql + whereClause, params, (err, countResults) => {
      if (err) {
        // ❌ 总数查询失败
        console.error("❌ 总数查询执行错误:", err);
        connection.release(); // 释放连接
        return res.status(500).json({ 
          error: "查询总数失败", 
          details: err.message 
        });
      }
      
      // 📊 获取总数量
      const total = countResults[0].total; 
      console.log(`📈 总数量: ${total}`);
      
      // 🎯 第二步：查询分页数据
      // 构建数据查询参数数组
      const dataParams = [...params, pageSize, offset]; // 搜索参数 + 分页参数
      
      connection.query(dataSql, dataParams, (err, results) => {
        // 🔓 释放数据库连接（重要！避免连接泄漏）
        connection.release(); 
        
        if (err) {
          // ❌ 分页查询失败
          console.error("❌ 分页查询执行错误:", err);
          return res.status(500).json({ 
            error: "查询失败", 
            details: err.message 
          });
        }
        
        // ✅ 查询成功，记录调试信息
        console.log("📋 查询结果数量:", results.length);
        console.log("📄 分页详情:", {
          currentPage: page,        // 当前页码
          pageSize: pageSize,       // 每页条数
          total: total,             // 总数据条数
          totalPages: Math.ceil(total / pageSize), // 总页数
          hasNext: page < Math.ceil(total / pageSize), // 是否有下一页
          hasPrev: page > 1         // 是否有上一页
        });
        
        // 🎨 设置响应头，确保返回JSON格式
        res.setHeader('Content-Type', 'application/json');
        
        // 📦 返回统一的响应格式
        res.json({
          success: true,           // 操作是否成功
          data: results,           // 当前页的数据数组
          pagination: {            // 分页信息
            currentPage: page,     // 当前页码
            pageSize: pageSize,    // 每页条数
            total: total,          // 总数据条数
            totalPages: Math.ceil(total / pageSize), // 总页数
            hasNext: page < Math.ceil(total / pageSize), // 是否有下一页
            hasPrev: page > 1,     // 是否有上一页
            from: offset + 1,      // 当前页数据起始序号
            to: Math.min(offset + pageSize, total) // 当前页数据结束序号
          },
          message: "查询成功"
        });
      });
    });
  });
});

// =============================================================================
// ✅ 模块7: 添加图书API
// 用途：向数据库中添加新的图书记录
// URL: POST /add
// 请求体参数：{ book_name: string, author: string, book_type: string, remarks: string }
// =============================================================================
app.post("/add", (req, res) => {
  // 🔗 从连接池获取数据库连接
  pool.getConnection((err, connection) => {
    if (err) {
      // ❌ 数据库连接失败处理
      console.error("❌ 添加图书时数据库连接错误:", err);
      return res.status(500).json({ 
        error: "数据库错误", 
        message: "无法连接到数据库" 
      }); 
    }

    // 📝 从请求体中安全提取图书信息（使用解构赋值）
    const { book_name, author, book_type, remarks } = req.body;

    // 🛡️ 基础数据验证（确保必要字段不为空）
    if (!book_name || !author) {
      console.log("❌ 添加图书失败：缺少必要字段");
      connection.release();
      return res.status(400).json({ 
        error: "添加失败", 
        message: "书名和作者为必填字段" 
      });
    }

    // 📋 记录添加操作信息
    console.log("📝 添加新图书:", {
      book_name: book_name,
      author: author,
      book_type: book_type || "(未分类)",
      remarks: remarks || "(无备注)"
    });

    // 🔐 安全插入SQL - 使用参数化查询防止SQL注入
    const sql = `INSERT INTO books(book_name, author, book_type, remarks) 
                VALUES (?, ?, ?, ?)`;

    // 🎯 执行数据库插入操作
    connection.query(
      sql,
      [book_name, author, book_type, remarks], // 参数数组 - MySQL会自动处理转义
      (err) => {
        // 🔓 释放数据库连接（重要！）
        connection.release(); 
        
        if (err) {
          // ❌ 插入失败处理
          console.error("❌ 图书插入失败:", err);
          return res.status(500).json({ 
            error: "插入失败", 
            message: "数据库操作失败", 
            details: err.message 
          });
        }
        
        // ✅ 插入成功
        console.log("✅ 图书添加成功:", book_name);
        res.json({
          success: true,
          message: "操作成功！",
          book_info: {
            book_name: book_name,
            author: author,
            book_type: book_type,
            remarks: remarks
          }
        });
      }
    );
  });
});

// =============================================================================
// ✅ 模块8: 编辑图书API
// 用途：根据ID 更新图书的详细信息
// URL: POST /edit
// 请求体参数：{ id: number, book_name: string, author: string, book_type: string, remarks: string }
// =============================================================================
app.post("/edit", (req, res) => {
  // 🔗 从连接池获取数据库连接
  pool.getConnection((err, connection) => {
    if (err) {
      // ❌ 数据库连接失败处理
      console.error("❌ 编辑图书时数据库连接错误:", err);
      return res.status(500).json({ 
        error: "数据库错误", 
        message: "无法连接到数据库" 
      }); 
    }

    // 📝 从请求体中提取编辑后的图书信息
    const { id, book_name, author, book_type, remarks } = req.body;

    // 🛡️ 基础数据验证
    if (!id) {
      console.log("❌ 编辑图书失败：缺少图书ID");
      connection.release();
      return res.status(400).json({ 
        error: "编辑失败", 
        message: "图书ID不能为空" 
      });
    }

    if (!book_name || !author) {
      console.log("❌ 编辑图书失败：缺少必要字段");
      connection.release();
      return res.status(400).json({ 
        error: "编辑失败", 
        message: "书名和作者为必填字段" 
      });
    }

    // 📋 记录编辑操作信息
    console.log("✏️ 编辑图书信息:", {
      id: id,
      book_name: book_name,
      author: author,
      book_type: book_type || "(未分类)",
      remarks: remarks || "(无备注)"
    });

    // 🔐 安全更新SQL - 使用参数化查询防止SQL注入
    const sql = `UPDATE books 
                SET book_name = ?, author = ?, book_type = ?, remarks = ?
                WHERE id = ?`;

    // 🎯 执行数据库更新操作
    connection.query(
      sql,
      [book_name, author, book_type, remarks, id], // 参数顺序必须与SQL中的?对应
      (err) => {
        // 🔓 释放数据库连接（重要！）
        connection.release(); 
        
        if (err) {
          // ❌ 更新失败处理
          console.error("❌ 图书更新失败:", err);
          return res.status(500).json({ 
            error: "编辑失败", 
            message: "数据库操作失败", 
            details: err.message 
          });
        }
        
        // ✅ 更新成功
        console.log("✅ 图书更新成功:", book_name);
        res.json({
          success: true,
          message: "操作成功！",
          book_info: {
            id: id,
            book_name: book_name,
            author: author,
            book_type: book_type,
            remarks: remarks
          }
        });
      }
    );
  });
});

// =============================================================================
// ✅ 模块9: 删除图书API (符合RESTful语义)
// 用途：根据ID删除指定的图书记录
// URL: DELETE /delete?id=图书ID
// 请求方法：DELETE (语义更清晰，符合RESTful规范)
// 请求参数：URL查询参数 - id (图书ID)
// =============================================================================
app.delete("/delete", (req, res) => {
  // 🔗 从连接池获取数据库连接
  pool.getConnection((err, connection) => {
    if (err) {
      // ❌ 数据库连接失败处理
      console.error("❌ 删除图书时数据库连接错误:", err);
      return res.status(500).json({ 
        error: "数据库错误", 
        message: "无法连接到数据库" 
      }); 
    }

    // 🔍 从URL查询参数中获取要删除的图书ID
    // 注意：DELETE操作使用URL参数，符合RESTful语义
    const { id } = req.query;

    // 🛡️ ID验证
    if (!id) {
      console.log("❌ 删除图书失败：缺少图书ID");
      connection.release();
      return res.status(400).json({ 
        error: "删除失败", 
        message: "图书ID不能为空" 
      });
    }

    // 📋 记录删除操作信息
    console.log("🗑️ 删除图书ID:", id);

    // 🔐 安全删除SQL - 使用参数化查询防止SQL注入
    const sql = `DELETE FROM books WHERE id = ?`;

    // 🎯 执行数据库删除操作
    connection.query(
      sql,
      [id], // 参数安全传递
      (err) => {
        // 🔓 释放数据库连接（重要！）
        connection.release(); 
        
        if (err) {
          // ❌ 删除失败处理
          console.error("❌ 图书删除失败:", err);
          return res.status(500).json({ 
            error: "删除失败", 
            message: "数据库操作失败", 
            details: err.message 
          });
        }
        
        // ✅ 删除成功
        console.log("✅ 图书删除成功:", id);
        res.json({
          success: true,
          message: "操作成功！",
          deleted_id: id
        });
      }
    );
  });
});

// =============================================================================
// ✅ 模块10: 开发环境直连测试接口
// 用途：验证开发环境前后端直连（不使用代理）是否正常工作
// URL: GET /test
// 用途说明：在开发时，如果前端axios的baseURL设置为 http://127.0.0.1:8000 
//          直接访问这个地址，测试前后端通信是否正常
// =============================================================================
app.get("/test", (req, res) => {
  // ✅ 记录测试成功信息
  console.log("✅ 开发环境测试成功 - 前端直接访问到后端了！");
  
  // 📋 记录请求详细信息（用于调试和分析）
  console.log("📋 请求详细信息:", {
    method: req.method,    // HTTP方法
    url: req.url,         // 请求URL
    headers: req.headers, // 请求头信息
    query: req.query,     // URL查询参数
    ip: req.ip           // 客户端IP地址
  });
  
  // 🎨 返回测试成功的响应数据
  res.json({
    success: true,                      // 操作是否成功
    message: "开发环境直连成功！前端直接访问后端", // 状态消息
    timestamp: new Date().toISOString(), // 服务器当前时间
    environment: "development",          // 环境标识
    requestInfo: {                      // 请求信息摘要
      method: req.method,               // HTTP方法
      url: req.url,                     // 请求URL
      query: req.query                  // 查询参数
    }
  });
});

// =============================================================================
// ✅ 模块11: 代理测试接口
// 用途：验证开发环境通过Vite代理访问是否正常工作
// URL: GET /api/test
// 用途说明：前端axios的baseURL设置为 /api 时，通过Vite代理转发到这个接口
//          用于测试代理配置是否正确，模拟生产环境的访问方式
// =============================================================================
app.get("/api/test", (req, res) => {
  // ✅ 记录代理测试成功信息
  console.log("✅ 代理测试成功 - 前端通过代理访问到后端了！");
  
  // 📋 记录请求详细信息（用于调试和分析）
  console.log("📋 请求详细信息:", {
    method: req.method,    // HTTP方法
    url: req.url,         // 请求URL（包含/api前缀）
    headers: req.headers, // 请求头信息
    query: req.query,     // URL查询参数
    ip: req.ip           // 客户端IP地址
  });
  
  // 🎨 返回测试成功的响应数据
  res.json({
    success: true,                      // 操作是否成功
    message: "代理连接成功！前后端通信正常", // 状态消息
    timestamp: new Date().toISOString(), // 服务器当前时间
    environment: "production",          // 环境标识（代理模式更像生产环境）
    requestInfo: {                      // 请求信息摘要
      method: req.method,               // HTTP方法
      url: req.url,                     // 请求URL（显示代理路径）
      query: req.query                  // 查询参数
    }
  });
});

// =============================================================================
// ✅ 模块12: 服务器启动
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
