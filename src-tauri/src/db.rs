/**
 * SQLite 数据库管理模块
 */

use rusqlite::{Connection, Result as SqliteResult};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

/// 数据库连接池
type DbPool = Arc<Mutex<Connection>>;

lazy_static::lazy_static! {
    static ref DB: DbPool = {
        let conn = init_database().expect("Failed to initialize database");
        Arc::new(Mutex::new(conn))
    };
}

/// 获取数据库连接
pub fn get_db() -> Arc<Mutex<Connection>> {
    DB.clone()
}

/// 初始化数据库
fn init_database() -> SqliteResult<Connection> {
    // 获取应用数据目录
    let data_dir = dirs::data_dir()
        .or_else(|| dirs::home_dir().map(|h| h.join(".myssh")))
        .unwrap_or_else(|| PathBuf::from("."));
    
    // 确保目录存在
    std::fs::create_dir_all(&data_dir).ok();
    
    // 数据库文件路径
    let db_path = data_dir.join("myssh.db");

    
    // 打开或创建数据库
    let conn = Connection::open(&db_path)?;
    
    // 创建表
    create_tables(&conn)?;
    
    Ok(conn)
}

/// 创建数据库表
fn create_tables(conn: &Connection) -> SqliteResult<()> {
    // 创建服务器配置表
    conn.execute(
        "CREATE TABLE IF NOT EXISTS servers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            host TEXT NOT NULL,
            port INTEGER NOT NULL,
            username TEXT NOT NULL,
            password TEXT,
            key_path TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )",
        [],
    )?;
    
    // 创建索引
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_servers_host ON servers(host)",
        [],
    )?;
    
    Ok(())
}

/// 执行数据库迁移
pub fn migrate_database(conn: &Connection) -> SqliteResult<()> {
    // 检查数据库版本
    let version: i32 = conn
        .query_row(
            "SELECT version FROM schema_version ORDER BY version DESC LIMIT 1",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);
    
    // 如果版本为 0，创建版本表
    if version == 0 {
        conn.execute(
            "CREATE TABLE IF NOT EXISTS schema_version (
                version INTEGER PRIMARY KEY,
                applied_at TEXT NOT NULL DEFAULT (datetime('now'))
            )",
            [],
        )?;
        
        conn.execute(
            "INSERT INTO schema_version (version) VALUES (1)",
            [],
        )?;
    }
    
    // 执行迁移
    // 这里可以添加更多的迁移逻辑
    
    Ok(())
}

