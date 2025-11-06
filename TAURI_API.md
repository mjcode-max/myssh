# Tauri API 接口说明

本文档列出了前端需要调用的 Tauri Rust 后端接口。

## 文件管理相关接口

### 1. 获取远程目录文件列表

**接口名称**: `list_remote_directory`

**参数**:
```typescript
{
  serverId: string,  // 服务器ID
  path: string       // 远程路径，如 "/home/user"
}
```

**返回格式**:
```typescript
{
  files: Array<{
    name: string,        // 文件名
    type: 'file' | 'directory',  // 文件类型
    size: number,       // 文件大小（字节）
    modified: string,   // 修改时间（ISO 8601 格式）
    path: string       // 完整路径
  }>
}
```

**调用位置**: `src/components/FileManagerTab.vue` - `loadFiles()` 函数

---

### 2. 上传文件到远程服务器

**接口名称**: `upload_file`

**参数**:
```typescript
{
  serverId: string,   // 服务器ID
  localPath: string,  // 本地文件路径
  remotePath: string  // 远程保存路径（目录）
}
```

**返回**: 成功返回 `{ success: true }`，失败抛出错误

**调用位置**: `src/components/FileManagerTab.vue` - `handleUpload()` 函数

**说明**: 
- 支持多文件上传（循环调用）
- 上传成功后需要刷新文件列表

---

### 3. 从远程服务器下载文件

**接口名称**: `download_file`

**参数**:
```typescript
{
  serverId: string,   // 服务器ID
  remotePath: string, // 远程文件路径
  localPath: string   // 本地保存路径（完整路径，包含文件名）
}
```

**返回**: 成功返回 `{ success: true }`，失败抛出错误

**调用位置**: `src/components/FileManagerTab.vue` - `handleDownload()` 函数

**说明**:
- 支持单文件和多文件下载
- 单文件：使用文件保存对话框，直接保存到指定路径
- 多文件：使用文件夹选择对话框，保存到指定文件夹

---

### 4. 创建远程目录

**接口名称**: `create_directory`

**参数**:
```typescript
{
  serverId: string,  // 服务器ID
  path: string       // 要创建的目录完整路径
}
```

**返回**: 成功返回 `{ success: true }`，失败抛出错误

**调用位置**: `src/components/FileManagerTab.vue` - `handleNewFolder()` 函数

---

### 5. 删除远程文件/目录

**接口名称**: `delete_files`

**参数**:
```typescript
{
  serverId: string,  // 服务器ID
  paths: string[]    // 要删除的文件/目录路径数组
}
```

**返回**: 成功返回 `{ success: true }`，失败抛出错误

**调用位置**: `src/components/FileManagerTab.vue` - `handleDelete()` 函数

**说明**:
- 支持批量删除
- 删除前需要用户确认（前端已实现）

---

## 系统监控相关接口

### 6. 获取系统监控数据

**接口名称**: `get_system_monitor`

**参数**:
```typescript
{
  serverId: string  // 服务器ID
}
```

**返回格式**:
```typescript
{
  cpu: {
    usage: number,              // CPU 总使用率 (0-100)
    cores: number,              // CPU 核心数
    frequency: number,          // CPU 频率 (MHz)
    loadAverage: string,        // 系统负载平均值，格式: "1.5, 0.8, 0.3"
    coresUsage: number[]       // 各核心使用率数组 [0-100, ...]
  },
  memory: {
    total: number,              // 总内存 (字节)
    used: number,              // 已用内存 (字节)
    cached: number,            // 缓存内存 (字节，可选)
    available: number          // 可用内存 (字节，由 total - used 计算)
  },
  disk: Array<{
    mount: string,             // 挂载点，如 "/"
    filesystem: string,       // 文件系统类型，如 "ext4"
    total: number,             // 总容量 (字节)
    used: number,             // 已用容量 (字节)
    available: number,        // 可用容量 (字节)
    usage: number             // 使用率 (0-100)
  }>,
  network: {
    download: number,          // 当前下载速度 (字节/秒)
    upload: number,            // 当前上传速度 (字节/秒)
    downloadTotal: number,     // 总下载量 (字节)
    uploadTotal: number        // 总上传量 (字节)
  }
}
```

**调用位置**: `src/components/MonitorTab.vue` - `loadMonitorData()` 函数

**说明**:
- 此接口需要实时调用（建议每2秒调用一次）
- 前端已实现自动刷新功能
- 网络流量数据需要计算差值（当前值 - 上次值）/ 时间间隔

---

## SSH 连接相关接口

### 7. 连接服务器

**接口名称**: `connect_ssh_server`

**参数**:
```typescript
{
  serverId: string,   // 服务器ID
  host: string,      // 主机地址
  port: number,      // 端口
  username: string, // 用户名
  password?: string,  // 密码（可选）
  keyPath?: string   // 密钥路径（可选）
}
```

**返回**: 成功返回 `{ success: true, connectionId: string }`，失败抛出错误

**调用位置**: `src/stores/serverStore.js` - `connectServer()` 函数

---

### 8. 断开服务器连接

**接口名称**: `disconnect_ssh_server`

**参数**:
```typescript
{
  serverId: string  // 服务器ID
}
```

**返回**: 成功返回 `{ success: true }`，失败抛出错误

**调用位置**: `src/stores/serverStore.js` - `disconnectServer()` 函数

---

### 9. 执行 SSH 命令

**接口名称**: `execute_ssh_command`

**参数**:
```typescript
{
  serverId: string,  // 服务器ID
  command: string    // 要执行的命令
}
```

**返回格式**:
```typescript
{
  output: string,   // 命令输出
  exitCode: number  // 退出码
}
```

**调用位置**: `src/components/TerminalTab.vue` - `executeCommand()` 函数

**说明**:
- 需要支持实时输出（可能需要使用事件或流）
- 建议使用 WebSocket 或事件系统实现实时终端输出

---

## 实现建议

1. **连接管理**: 在 Rust 后端维护一个连接池，使用 `serverId` 作为键
2. **错误处理**: 所有接口都应该有完善的错误处理，返回详细的错误信息
3. **异步操作**: 文件上传下载等操作应该是异步的，避免阻塞 UI
4. **进度反馈**: 对于大文件上传下载，建议实现进度回调机制
5. **安全性**: 
   - 密码不应该存储在内存中太久
   - 使用安全的密钥管理
   - 验证文件路径，防止路径遍历攻击

---

## 前端调用示例

### 获取文件列表
```javascript
import { invoke } from '@tauri-apps/api/tauri'

const result = await invoke('list_remote_directory', {
  serverId: '123',
  path: '/home/user'
})
console.log(result.files)
```

### 上传文件
```javascript
await invoke('upload_file', {
  serverId: '123',
  localPath: '/Users/username/file.txt',
  remotePath: '/home/user'
})
```

### 下载文件
```javascript
await invoke('download_file', {
  serverId: '123',
  remotePath: '/home/user/file.txt',
  localPath: '/Users/username/downloads/file.txt'
})
```

### 执行命令
```javascript
const result = await invoke('execute_ssh_command', {
  serverId: '123',
  command: 'ls -la'
})
console.log(result.output)
```

### 获取系统监控
```javascript
const data = await invoke('get_system_monitor', {
  serverId: '123'
})
console.log('CPU使用率:', data.cpu.usage)
console.log('内存使用:', data.memory.used / data.memory.total * 100, '%')
```

