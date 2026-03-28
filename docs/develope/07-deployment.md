# 部署方案

## 整体架构

```
+------------------------------------------------------------------+
|                        用户浏览器                                |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                     Vercel (前端)                                |
|  +------------------------------------------------------------+  |
|  |  React App (Vercel Edge Network)                           |  |
|  |  - 自动 HTTPS                                              |  |
|  |  - CDN 加速                                                |  |
|  |  - 边缘函数                                                |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                    Render (后端 API)                             |
|  +------------------------------------------------------------+  |
|  |  Node.js + Express                                        |  |
|  |  - Web Service                                            |  |
|  |  - 自动重启                                               |  |
|  |  - 环境变量管理                                           |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|               PostgreSQL (数据库)                                |
|  +------------------------------------------------------------+  |
|  |  - 副本集集群                                              |  |
|  |  - 自动备份                                               |  |
|  |  - 性能监控                                               |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
```

---

## 前端部署 (Vercel)

### 1. 准备工作

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login
```

### 2. 项目配置

创建 `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-api.render.com/api/:path*"
    }
  ]
}
```

### 3. 环境变量

在 Vercel 控制台设置：

| 变量名 | 值 |
|--------|-----|
| VITE_API_URL | `https://your-api.render.com` |
| VITE_APP_NAME | Todo App |

### 4. 部署命令

```bash
# 链接项目
vercel link

# 部署到生产环境
vercel --prod
```

### 5. 自动部署

1. 推送代码到 GitHub
2. 在 Vercel 控制台导入仓库
3. 设置构建命令和输出目录
4. 启用自动部署

---

## 后端部署 (Render)

### 1. 创建 Render 账户

- 访问 [render.com](https://render.com)
- 连接 GitHub 仓库

### 2. 创建 Web Service

| 配置项 | 值 |
|--------|-----|
| Name | todo-api |
| Environment | Node |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Instance Type | Free |

### 3. 环境变量

在 Render 控制台设置：

| 变量名 | 值 |
|--------|-----|
| DATABASE_URL | `postgresql://user:password@host:5432/db` |
| JWT_SECRET | `your-jwt-secret-key` |
| JWT_EXPIRES_IN | `7d` |
| PORT | `10000` |
| NODE_ENV | `production` |
| CORS_ORIGIN | `https://your-frontend.vercel.app` |

### 4. 健康检查

Render 自动配置健康检查端点 `/`:

```typescript
// src/index.ts
app.get('/', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

---

## 数据库 (PostgreSQL)

### 选项 1: Render PostgreSQL

| 配置项 | 值 |
|--------|-----|
| Plan | Free |
| Instance Type | Free |
| Region | 与后端同一区域 |

### 选项 2: Supabase

| 配置项 | 值 |
|--------|-----|
| Plan | Free |
| 存储 | 500MB |
| 带宽 | 2GB/月 |

### 数据库连接

```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// .env
DATABASE_URL="postgresql://user:password@hostname:5432/database"
```

---

## 域名配置

### Vercel 前端

1. 在 Vercel 控制台添加自定义域名
2. 在域名服务商处配置 DNS：
   - CNAME: `@` -> `cname.vercel-dns.com`

### Render 后端

1. 在 Render 控制台添加自定义域名
2. 在域名服务商处配置 DNS：
   - CNAME: `api` -> `onrender.com`

---

## CI/CD 流程

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run build
      - uses: render-compute/action-deploy@v1
        with:
          render-token: ${{ secrets.RENDER_TOKEN }}
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
```

---

## 监控与日志

### Render 日志

- 实时日志查看
- 日志搜索
- 日志导出

### 性能监控

- Vercel Analytics
- Render Metrics
- DataDog / New Relic（可选）

---

## 成本估算

### 免费方案（适合开发和测试）

| 服务 | 免费额度 | 成本 |
|------|----------|------|
| Vercel | 100GB 带宽/月 | $0 |
| Render | 750 小时运行/月 | $0 |
| PostgreSQL | 256MB 存储 | $0 |
| **总计** | | **$0/月** |

### 生产方案（1000 用户）

| 服务 | 方案 | 成本 |
|------|------|------|
| Vercel Pro | $20/月（团队） | $20 |
| Render | $25/月（Basic） | $25 |
| PostgreSQL | $20/月（Standard） | $20 |
| **总计** | | **$65/月** |

---

## 安全配置

### 后端安全

```typescript
// helmet 配置
import helmet from 'helmet';
app.use(helmet());

// CORS 配置
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));

// 速率限制
import rateLimit from 'express-rate-limit';
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 限制 100 次请求
}));
```

### 数据安全

- PostgreSQL SSL/TLS 连接
- JWT Secret 安全存储
- 密码 bcrypt 加密
- 环境变量敏感信息

---

## 备份与恢复

### 数据库备份

- Render PostgreSQL 自动每日备份
- 保留 7 天
- 支持手动备份恢复
