/**
 * 服务器配置 CRUD 相关命令处理
 */

use serde::{Deserialize, Serialize};
use rusqlite::{params, OptionalExtension};
use crate::db::get_db;

/// 服务器配置信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerConfig {
    pub id: String,
    pub name: String,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: Option<String>,
    pub key_path: Option<String>,
}

/// 获取所有服务器配置参数
#[derive(Debug, Deserialize)]
pub struct GetServersParams {}

/// 获取所有服务器配置返回
#[derive(Debug, Serialize)]
pub struct GetServersResult {
    pub servers: Vec<ServerConfig>,
}

/// 保存服务器配置参数
#[derive(Debug, Deserialize)]
pub struct SaveServerParams {
    pub id: String,
    pub name: String,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: Option<String>,
    pub key_path: Option<String>,
}

/// 保存服务器配置返回
#[derive(Debug, Serialize)]
pub struct SaveServerResult {
    pub success: bool,
    pub id: String,
    pub message: Option<String>,
}

/// 更新服务器配置参数
#[derive(Debug, Deserialize)]
pub struct UpdateServerParams {
    pub id: String,
    pub name: Option<String>,
    pub host: Option<String>,
    pub port: Option<u16>,
    pub username: Option<String>,
    pub password: Option<String>,
    pub key_path: Option<String>,
}

/// 更新服务器配置返回
#[derive(Debug, Serialize)]
pub struct UpdateServerResult {
    pub success: bool,
    pub message: Option<String>,
}

/// 删除服务器配置参数
#[derive(Debug, Deserialize)]
pub struct DeleteServerParams {
    pub server_id: String,
}

/// 删除服务器配置返回
#[derive(Debug, Serialize)]
pub struct DeleteServerResult {
    pub success: bool,
    pub message: Option<String>,
}

/// 获取单个服务器配置参数
#[derive(Debug, Deserialize)]
pub struct GetServerParams {
    pub server_id: String,
}

/// 获取单个服务器配置返回
#[derive(Debug, Serialize)]
pub struct GetServerResult {
    pub server: Option<ServerConfig>,
}

/// 获取所有服务器配置
/// 
/// # 命令名称
/// `get_servers`
/// 
/// # 返回
/// - `servers`: 服务器配置列表
#[tauri::command]
pub async fn get_servers() -> Result<GetServersResult, String> {
    let db = get_db();
    let conn = db.lock().map_err(|e| format!("数据库锁定失败: {}", e))?;
    
    let mut stmt = conn
        .prepare("SELECT id, name, host, port, username, password, key_path FROM servers ORDER BY created_at DESC")
        .map_err(|e| format!("查询准备失败: {}", e))?;
    
    let server_iter = stmt
        .query_map([], |row| {
            Ok(ServerConfig {
                id: row.get(0)?,
                name: row.get(1)?,
                host: row.get(2)?,
                port: row.get(3)?,
                username: row.get(4)?,
                password: row.get(5)?,
                key_path: row.get(6)?,
            })
        })
        .map_err(|e| format!("查询执行失败: {}", e))?;
    
    let mut servers = Vec::new();
    for server in server_iter {
        servers.push(server.map_err(|e| format!("数据解析失败: {}", e))?);
    }
    
    Ok(GetServersResult {
        servers: servers,
    })
}

/// 保存服务器配置
/// 
/// # 命令名称
/// `save_server`
/// 
/// # 参数
/// - `id`: 服务器ID
/// - `name`: 服务器名称
/// - `host`: 主机地址
/// - `port`: 端口
/// - `username`: 用户名
/// - `password`: 密码（可选）
/// - `key_path`: 密钥路径（可选）
/// 
/// # 返回
/// - `success`: 是否成功
/// - `id`: 服务器ID
/// - `message`: 消息（可选）
#[tauri::command]
pub async fn save_server(params: SaveServerParams) -> Result<SaveServerResult, String> {
    let db = get_db();
    let conn = db.lock().map_err(|e| format!("数据库锁定失败: {}", e))?;
    
    // 检查服务器是否已存在
    let exists: bool = conn
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM servers WHERE id = ?1)",
            params![params.id],
            |row| row.get(0),
        )
        .map_err(|e| format!("查询失败: {}", e))?;
    
    if exists {
        // 更新现有记录
        conn.execute(
            "UPDATE servers SET name = ?2, host = ?3, port = ?4, username = ?5, password = ?6, key_path = ?7, updated_at = datetime('now') WHERE id = ?1",
            params![
                params.id,
                params.name,
                params.host,
                params.port,
                params.username,
                params.password,
                params.key_path
            ],
        )
        .map_err(|e| format!("更新失败: {}", e))?;
    } else {
        // 插入新记录
        conn.execute(
            "INSERT INTO servers (id, name, host, port, username, password, key_path) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                params.id,
                params.name,
                params.host,
                params.port,
                params.username,
                params.password,
                params.key_path
            ],
        )
        .map_err(|e| format!("插入失败: {}", e))?;
    }
    
    Ok(SaveServerResult {
        success: true,
        id: params.id,
        message: Some("保存成功".to_string()),
    })
}

/// 更新服务器配置
/// 
/// # 命令名称
/// `update_server`
/// 
/// # 参数
/// - `id`: 服务器ID
/// - `name`: 服务器名称（可选）
/// - `host`: 主机地址（可选）
/// - `port`: 端口（可选）
/// - `username`: 用户名（可选）
/// - `password`: 密码（可选）
/// - `key_path`: 密钥路径（可选）
/// 
/// # 返回
/// - `success`: 是否成功
/// - `message`: 消息（可选）
#[tauri::command]
pub async fn update_server(params: UpdateServerParams) -> Result<UpdateServerResult, String> {
    let db = get_db();
    let conn = db.lock().map_err(|e| format!("数据库锁定失败: {}", e))?;
    
    // 检查服务器是否存在
    let exists: bool = conn
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM servers WHERE id = ?1)",
            params![params.id],
            |row| row.get(0),
        )
        .map_err(|e| format!("查询失败: {}", e))?;
    
    if !exists {
        return Err("服务器不存在".to_string());
    }
    
    // 构建更新语句 - 使用多个独立的 UPDATE 语句
    let mut updated = false;
    
    if let Some(name) = &params.name {
        conn.execute(
            "UPDATE servers SET name = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![name, params.id],
        )
        .map_err(|e| format!("更新名称失败: {}", e))?;
        updated = true;
    }
    
    if let Some(host) = &params.host {
        conn.execute(
            "UPDATE servers SET host = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![host, params.id],
        )
        .map_err(|e| format!("更新主机失败: {}", e))?;
        updated = true;
    }
    
    if let Some(port) = &params.port {
        conn.execute(
            "UPDATE servers SET port = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![port, params.id],
        )
        .map_err(|e| format!("更新端口失败: {}", e))?;
        updated = true;
    }
    
    if let Some(username) = &params.username {
        conn.execute(
            "UPDATE servers SET username = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![username, params.id],
        )
        .map_err(|e| format!("更新用户名失败: {}", e))?;
        updated = true;
    }
    
    if params.password.is_some() {
        conn.execute(
            "UPDATE servers SET password = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![params.password, params.id],
        )
        .map_err(|e| format!("更新密码失败: {}", e))?;
        updated = true;
    }
    
    if params.key_path.is_some() {
        conn.execute(
            "UPDATE servers SET key_path = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![params.key_path, params.id],
        )
        .map_err(|e| format!("更新密钥路径失败: {}", e))?;
        updated = true;
    }
    
    if !updated {
        return Ok(UpdateServerResult {
            success: true,
            message: Some("没有需要更新的字段".to_string()),
        });
    }
    
    Ok(UpdateServerResult {
        success: true,
        message: Some("更新成功".to_string()),
    })
}

/// 删除服务器配置
/// 
/// # 命令名称
/// `delete_server`
/// 
/// # 参数
/// - `server_id`: 服务器ID
/// 
/// # 返回
/// - `success`: 是否成功
/// - `message`: 消息（可选）
#[tauri::command]
pub async fn delete_server(params: DeleteServerParams) -> Result<DeleteServerResult, String> {
    let db = get_db();
    let conn = db.lock().map_err(|e| format!("数据库锁定失败: {}", e))?;
    
    let rows_affected = conn
        .execute("DELETE FROM servers WHERE id = ?1", params![params.server_id])
        .map_err(|e| format!("删除失败: {}", e))?;
    
    if rows_affected == 0 {
        return Err("服务器不存在".to_string());
    }
    
    Ok(DeleteServerResult {
        success: true,
        message: Some("删除成功".to_string()),
    })
}

/// 获取单个服务器配置
/// 
/// # 命令名称
/// `get_server`
/// 
/// # 参数
/// - `server_id`: 服务器ID
/// 
/// # 返回
/// - `server`: 服务器配置（可选）
#[tauri::command]
pub async fn get_server(params: GetServerParams) -> Result<GetServerResult, String> {
    let db = get_db();
    let conn = db.lock().map_err(|e| format!("数据库锁定失败: {}", e))?;
    
    let server = conn
        .query_row(
            "SELECT id, name, host, port, username, password, key_path FROM servers WHERE id = ?1",
            params![params.server_id],
            |row| {
                Ok(ServerConfig {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    host: row.get(2)?,
                    port: row.get(3)?,
                    username: row.get(4)?,
                    password: row.get(5)?,
                    key_path: row.get(6)?,
                })
            },
        )
        .optional()
        .map_err(|e| format!("查询失败: {}", e))?;
    
    Ok(GetServerResult {
        server: server,
    })
}

