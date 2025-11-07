/**
 * 系统监控相关命令处理
 */

use serde::{Deserialize, Serialize};

/// CPU 信息
#[derive(Debug, Serialize)]
pub struct CpuInfo {
    pub usage: f64,           // CPU 总使用率 (0-100)
    pub cores: usize,         // CPU 核心数
    pub frequency: f64,       // CPU 频率 (MHz)
    pub load_average: String, // 系统负载平均值，格式: "1.5, 0.8, 0.3"
    pub cores_usage: Vec<f64>, // 各核心使用率数组 [0-100, ...]
}

/// 内存信息
#[derive(Debug, Serialize)]
pub struct MemoryInfo {
    pub total: u64,      // 总内存 (字节)
    pub used: u64,       // 已用内存 (字节)
    pub cached: Option<u64>, // 缓存内存 (字节，可选)
    pub available: u64,  // 可用内存 (字节)
}

/// 磁盘信息
#[derive(Debug, Serialize)]
pub struct DiskInfo {
    pub mount: String,      // 挂载点，如 "/"
    pub filesystem: String, // 文件系统类型，如 "ext4"
    pub total: u64,         // 总容量 (字节)
    pub used: u64,          // 已用容量 (字节)
    pub available: u64,      // 可用容量 (字节)
    pub usage: f64,         // 使用率 (0-100)
}

/// 网络信息
#[derive(Debug, Serialize)]
pub struct NetworkInfo {
    pub download: u64,        // 当前下载速度 (字节/秒)
    pub upload: u64,          // 当前上传速度 (字节/秒)
    pub download_total: u64, // 总下载量 (字节)
    pub upload_total: u64,   // 总上传量 (字节)
}

/// 系统监控数据
#[derive(Debug, Serialize)]
pub struct SystemMonitorData {
    pub cpu: CpuInfo,
    pub memory: MemoryInfo,
    pub disk: Vec<DiskInfo>,
    pub network: NetworkInfo,
}

/// 获取系统监控数据参数
#[derive(Debug, Deserialize)]
pub struct GetSystemMonitorParams {
    pub server_id: String,
}

/// 获取系统监控数据
/// 
/// # 命令名称
/// `get_system_monitor`
/// 
/// # 参数
/// - `server_id`: 服务器ID
/// 
/// # 返回
/// - `cpu`: CPU 信息
/// - `memory`: 内存信息
/// - `disk`: 磁盘信息数组
/// - `network`: 网络信息
#[tauri::command]
pub async fn get_system_monitor(params: GetSystemMonitorParams) -> Result<SystemMonitorData, String> {
    // TODO: 实现实际的系统监控数据获取逻辑
    // 这里需要通过 SSH 执行系统命令来获取监控数据
    // 例如：top, df, free, ifconfig 等命令
    
    // 模拟返回
    Ok(SystemMonitorData {
        cpu: CpuInfo {
            usage: 25.5,
            cores: 4,
            frequency: 2400.0,
            load_average: "1.5, 0.8, 0.3".to_string(),
            cores_usage: vec![20.0, 25.0, 30.0, 27.0],
        },
        memory: MemoryInfo {
            total: 8 * 1024 * 1024 * 1024, // 8GB
            used: 4 * 1024 * 1024 * 1024,  // 4GB
            cached: Some(1 * 1024 * 1024 * 1024), // 1GB
            available: 4 * 1024 * 1024 * 1024,  // 4GB
        },
        disk: vec![
            DiskInfo {
                mount: "/".to_string(),
                filesystem: "ext4".to_string(),
                total: 100 * 1024 * 1024 * 1024, // 100GB
                used: 50 * 1024 * 1024 * 1024,   // 50GB
                available: 50 * 1024 * 1024 * 1024, // 50GB
                usage: 50.0,
            },
        ],
        network: NetworkInfo {
            download: 1024 * 1024,      // 1MB/s
            upload: 512 * 1024,         // 512KB/s
            download_total: 10 * 1024 * 1024 * 1024, // 10GB
            upload_total: 5 * 1024 * 1024 * 1024,   // 5GB
        },
    })
}

