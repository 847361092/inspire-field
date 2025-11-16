# Twikoo 评论系统部署指南

本指南将帮助您在本地和 Vercel 上部署 Twikoo 评论系统。

## 🚀 快速开始

### 1. 本地 Docker 测试（推荐）

#### 步骤 1: 创建 Docker Compose 文件

在项目根目录创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  # MongoDB 数据库
  mongodb:
    image: mongo:7.0
    container_name: twikoo-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
      MONGO_INITDB_DATABASE: twikoo
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
      - ./init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js:ro

  # Twikoo 评论系统
  twikoo:
    image: imaegoo/twikoo:latest
    container_name: twikoo-server
    restart: unless-stopped
    environment:
      # MongoDB 连接
      MONGO_URI: mongodb://admin:password123@mongodb:27017/twikoo
      # 服务端口
      TWIKOO_PORT: 8080
      # 管理员密码（可选）
      TWIKOO_SECRET: your-secret-key
      # 其他配置
      TWIKOO_IP: 0.0.0.0
    ports:
      - "8080:8080"
    depends_on:
      - mongodb
    volumes:
      - twikoo_data:/app/data

volumes:
  mongodb_data:
    driver: local
  twikoo_data:
    driver: local
```

#### 步骤 2: 创建 MongoDB 初始化脚本

创建 `init-mongo.js`：

```javascript
db = db.getSiblingDB('twikoo');

// 创建 Twikoo 用户
db.createUser({
  user: 'twikoo',
  pwd: 'twikoo123',
  roles: [
    {
      role: 'readWrite',
      db: 'twikoo'
    }
  ]
});
```

#### 步骤 3: 启动服务

```bash
# 启动 Docker Compose
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

#### 步骤 4: 配置环境变量

创建 `.env` 文件：

```env
# 本地开发环境
VITE_TWIKOO_ENV_ID=http://localhost:8080
```

### 2. Vercel 生产部署

#### 步骤 1: 准备 MongoDB Atlas

1. 访问 [MongoDB Atlas](https://cloud.mongodb.com/)
2. 创建免费账户
3. 创建新集群（选择免费 M0 级别）
4. 配置网络访问（允许所有 IP：0.0.0.0/0）
5. 创建数据库用户
6. 获取连接字符串

#### 步骤 2: 部署 Twikoo 到 Vercel

方法一：使用 Vercel 模板（推荐）

1. 访问 [Twikoo Vercel 模板](https://vercel.com/templates/Next.js/twikoo)
2. 点击 "Deploy"
3. 连接 GitHub 账号
4. Fork 到你的账号
5. 配置环境变量：
   - `MONGODB_URI`: MongoDB Atlas 连接字符串
   - `TWIKOO_SECRET`: 自定义密钥（可选）

方法二：手动部署

1. Fork [Twikoo 仓库](https://github.com/twikoojs/twikoo)
2. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
3. 点击 "New Project"
4. 导入你 Fork 的仓库
5. 配置环境变量
6. 点击 "Deploy"

#### 步骤 3: 获取 Twikoo 地址

部署完成后，你会得到一个类似这样的 URL：
```
https://your-twikoo-app.vercel.app
```

#### 步骤 4: 更新环境变量

更新你的 `.env` 文件：

```env
# Vercel 生产环境
VITE_TWIKOO_ENV_ID=https://your-twikoo-app.vercel.app
```

## 📱 访问管理面板

部署完成后，你可以访问管理面板：

```
https://your-twikoo-app.vercel.app/admin
```

使用你在环境变量中设置的 `TWIKOO_SECRET` 作为密码登录。

## 🔧 配置选项

### 环境变量说明

| 变量名 | 说明 | 必填 | 示例 |
|--------|------|------|------|
| `MONGO_URI` | MongoDB 连接字符串 | 是 | `mongodb+srv://...` |
| `TWIKOO_SECRET` | 管理面板密码 | 否 | `my-secret-key` |
| `TWIKOO_PORT` | 服务端口 | 否 | `8080` |
| `TWIKOO_IP` | 绑定 IP | 否 | `0.0.0.0` |

### 前端配置

在你的 Vue 项目中，评论组件会自动读取环境变量：

```typescript
// src/composables/useTwikoo.ts
const envId = import.meta.env.VITE_TWIKOO_ENV_ID || 'https://your-twikoo-app.vercel.app'
```

## 🛠️ 故障排除

### 1. Docker 相关问题

**问题**: 容器无法启动
```bash
# 查看容器状态
docker-compose ps

# 查看详细日志
docker-compose logs twikoo
docker-compose logs mongodb
```

**问题**: MongoDB 连接失败
- 检查 `MONGO_URI` 配置
- 确认 MongoDB 容器正在运行
- 检查网络连接

### 2. Vercel 相关问题

**问题**: 函数部署失败
- 检查环境变量是否正确设置
- 查看 Vercel 部署日志
- 确认 MongoDB Atlas 网络配置

**问题**: 评论无法加载
- 检查浏览器控制台错误
- 确认 Twikoo URL 可访问
- 检查 CORS 配置

### 3. 常见错误

**CORS 错误**: 确保你的前端域名已添加到允许列表中。

**连接超时**: 检查 MongoDB Atlas 的网络访问配置，确保允许你的 IP 地址。

## 📝 备份策略

### MongoDB 备份

```bash
# 备份数据库
mongodump --uri="mongodb://admin:password123@localhost:27017/twikoo" --out=./backup

# 恢复数据库
mongorestore --uri="mongodb://admin:password123@localhost:27017/twikoo" ./backup/twikoo
```

### Docker 数据备份

```bash
# 导出数据卷
docker run --rm -v twikoo_mongodb_data:/data -v $(pwd):/backup ubuntu tar cvf /backup/mongodb_backup.tar /data

# 导入数据卷
docker run --rm -v twikoo_mongodb_data:/data -v $(pwd):/backup ubuntu tar xvf /backup/mongodb_backup.tar -C /
```

## 🚀 性能优化

1. **使用 CDN**: 在生产环境中使用 CDN 加速 Twikoo 脚本加载
2. **图片优化**: 启用评论图片压缩和自动格式转换
3. **缓存配置**: 配置适当的缓存策略减少数据库查询

## 📚 更多资源

- [Twikoo 官方文档](https://twikoo.js.org/)
- [Twikoo GitHub 仓库](https://github.com/twikoojs/twikoo)
- [MongoDB Atlas 文档](https://docs.atlas.mongodb.com/)
- [Vercel 部署文档](https://vercel.com/docs)