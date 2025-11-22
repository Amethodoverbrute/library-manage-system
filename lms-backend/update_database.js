// 数据库更新脚本
const mysql = require('mysql2');
const config = require('./config').mysql;

// 创建数据库连接
const connection = mysql.createConnection(config);

connection.connect((err) => {
    if (err) {
        console.error('数据库连接失败:', err);
        return;
    }
    console.log('数据库连接成功');
    
    // 执行更新操作
    updateDatabase();
});

async function updateDatabase() {
    try {
        // 1. 创建用户表
        await createUsersTable();
        
        // 2. 修改books表，添加user_id字段和外键
        await modifyBooksTable();
        
        // 3. 创建默认管理员用户（如果不存在）
        await createDefaultUser();
        
        // 4. 更新已存在的图书记录，设置默认用户ID
        await updateExistingBooks();
        
        console.log('数据库更新完成！');
        connection.end();
    } catch (error) {
        console.error('数据库更新失败:', error);
        connection.end();
    }
}

function createUsersTable() {
    return new Promise((resolve, reject) => {
        const sql = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
                username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
                password VARCHAR(255) NOT NULL COMMENT '加密后的密码',
                email VARCHAR(100) UNIQUE COMMENT '邮箱地址',
                nickname VARCHAR(50) DEFAULT NULL COMMENT '用户昵称',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                last_login DATETIME DEFAULT NULL COMMENT '最后登录时间'
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户信息表';
        `;
        
        connection.query(sql, (err, results) => {
            if (err) {
                reject(err);
            } else {
                console.log('用户表创建成功');
                resolve(results);
            }
        });
    });
}

function modifyBooksTable() {
    return new Promise((resolve, reject) => {
        // 首先检查books表是否存在user_id字段
        connection.query('SHOW COLUMNS FROM books LIKE ?', ['user_id'], (err, results) => {
            if (err) {
                reject(err);
                return;
            }
            
            // 如果user_id字段不存在，则添加该字段
            if (results.length === 0) {
                const sql = `
                    ALTER TABLE books
                    ADD COLUMN user_id INT NOT NULL COMMENT '所属用户ID',
                    ADD CONSTRAINT fk_books_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
                `;
                
                connection.query(sql, (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('books表修改成功，添加了user_id字段和外键');
                        resolve(results);
                    }
                });
            } else {
                console.log('books表已包含user_id字段，跳过修改');
                resolve();
            }
        });
    });
}

function createDefaultUser() {
    return new Promise((resolve, reject) => {
        // 检查是否已有用户
        connection.query('SELECT COUNT(*) AS count FROM users', (err, results) => {
            if (err) {
                reject(err);
                return;
            }
            
            const userCount = results[0].count;
            
            // 如果没有用户，创建默认管理员用户
            if (userCount === 0) {
                // 使用简单密码用于演示，实际生产环境应该使用强密码
                const sql = `
                    INSERT INTO users (username, password, nickname) 
                    VALUES ('admin', 'admin123', '系统管理员');
                `;
                
                connection.query(sql, (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('默认管理员用户创建成功: admin/admin123');
                        resolve(results);
                    }
                });
            } else {
                console.log('用户表已有数据，跳过默认用户创建');
                resolve();
            }
        });
    });
}

function updateExistingBooks() {
    return new Promise((resolve, reject) => {
        // 将已存在的图书记录的user_id设置为1（默认管理员ID）
        const sql = 'UPDATE books SET user_id = 1 WHERE user_id IS NULL';
        
        connection.query(sql, (err, results) => {
            if (err) {
                reject(err);
            } else {
                console.log(`已更新 ${results.affectedRows} 条图书记录的用户ID`);
                resolve(results);
            }
        });
    });
}
