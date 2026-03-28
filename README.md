# 待辦事項管理系統 (TaskManager)

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178c6.svg)](https://www.typescriptlang.org/)

一個功能完整的全棧待辦事項管理網站，參照專案管理模式，支援任務狀態流轉、任務依賴關係、看板列順序鎖定等功能。

> **最後更新**: 2026-03-28 | **版本**: v1.0.0

## 📋 目錄

- [功能特色](#功能特色)
- [技術棧](#技術棧)
- [專案結構](#專案結構)
- [快速開始](#快速開始)
- [環境變數](#環境變數)
- [文檔導覽](#文檔導覽)
- [部署](#部署)
- [授權](#授權)

---

## ✨ 功能特色

### 使用者功能
- [x] 使用者註冊與登入
- [x] JWT 認證
- [x] 個人資料管理
- [x] 頭像上傳

### 專案功能
- [x] 建立、編輯、刪除專案
- [x] 專案成員管理 (OWNER/ADMIN/MEMBER)
- [x] 成員邀請系統

### 任務功能
- [x] 建立、編輯、刪除任務
- [x] 任務狀態流轉（Backlog → Ready → In Progress → Review → Done）
- [x] 任務優先級（低/中/高/緊急）
- [x] 截止日期設定
- [x] 任務指派（多人）
- [x] 任務依賴關係
- [x] 任務留言
- [x] 看板視圖（Kanban Board）
- [x] 拖拽排序

### 看板功能
- [x] 看板列管理
- [x] 列順序鎖定
- [x] 列拖拽排序

### 進階功能
- [x] 深色/淺色主題（支援系統跟隨）
- [x] RWD 響應式設計（手機/平板/桌面）
- [x] API Key 管理
- [x] 活動日誌
- [x] 自動化測試（Vitest + Playwright）

---

## 🛠 技術棧

### 前端
| 技術 | 用途 |
|------|------|
| React 18+ | UI 框架 |
| Vite 5+ | 建構工具 |
| TypeScript 5+ | 類型安全 |
| Tailwind CSS 3+ | 樣式框架 |
| shadcn/ui | 組件庫 |
| React Router 6+ | 路由管理 |
| Zustand | 狀態管理 |
| React Hook Form 7+ | 表單處理 |
| Zod | 資料驗證 |
| Axios | HTTP 客戶端 |
| @dnd-kit | 拖拽排序 |
| Vitest + Playwright | 測試 |

### 後端
| 技術 | 用途 |
|------|------|
| Node.js 20+ | 執行環境 |
| Express 4+ | Web 框架 |
| TypeScript 5+ | 類型安全 |
| Prisma 5+ | ORM |
| PostgreSQL 15+ | 資料庫 |
| JWT | 認證 |
| bcrypt 5+ | 密碼加密 |
| Multer | 檔案上傳 |
| express-rate-limit | 請求限流 |
| Helmet | 安全 Headers |
| Vitest | 單元/整合測試 |

---

## 📁 專案結構

```
taskmanager/
├── frontend/                 # 前端專案
│   ├── src/
│   │   ├── __tests__/       # 單元測試
│   │   ├── components/       # React 組件
│   │   │   ├── layout/       # 佈局組件
│   │   │   ├── providers/    # Context Providers
│   │   │   └── ui/           # UI 基礎組件
│   │   ├── pages/            # 頁面
│   │   ├── services/         # API 服務
│   │   ├── store/            # Zustand 狀態管理
│   │   └── hooks/            # 自定義 Hooks
│   └── e2e/                  # E2E 測試
│
├── backend/                  # 後端專案
│   ├── src/
│   │   ├── __tests__/        # 測試
│   │   ├── controllers/      # 控制器
│   │   ├── middlewares/      # 中間件
│   │   ├── routes/           # 路由
│   │   ├── utils/            # 工具函數
│   │   └── index.ts          # 入口檔案
│   └── prisma/
│       ├── migrations/       # 資料庫遷移
│       └── schema.prisma     # 資料庫 Schema
│
├── docs/                     # 文件
│   ├── api/                  # API 文檔
│   │   └── 01-api-list.md    # API 清單
│   ├── testing/              # 測試文檔
│   │   └── 01-test-list.md   # 測試項目列表
│   ├── user/                 # 用戶文檔
│   │   └── 01-user-guide.md  # 使用手冊
│   ├── develope/             # 開發文檔 (部分過時)
│   └── old/                  # 過時文件 (建議清理)
│
├── docker-compose.yml        # Docker 部署配置
├── README.md
└── LICENSE
```

---

## 🚀 快速開始

### 前置需求

- Node.js 20+
- PostgreSQL 資料庫
- Git

### 安裝步驟

1. **Clone 專案**

```bash
git clone https://github.com/mini-ytssamuel/TaskManager-dev.git
cd TaskManager-dev
```

2. **啟動 Docker 資料庫（可選）**

```bash
docker-compose up -d postgres
```

3. **安裝前端依賴**

```bash
cd frontend
npm install
```

4. **安裝後端依賴**

```bash
cd ../backend
npm install
```

5. **設定環境變數**

```bash
# 後端
cd backend
cp .env.example .env
# 編輯 .env 填入 DATABASE_URL 和 JWT_SECRET
```

6. **初始化資料庫**

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

7. **啟動開發伺服器**

```bash
# 終端機 1 - 前端
cd frontend
npm run dev

# 終端機 2 - 後端
cd backend
npm run dev
```

8. **開啟瀏覽器**

- 前端：http://localhost:5173
- 後端：http://localhost:3000
- API 文件：http://localhost:3000/api/test

---

## 🔐 環境變數

### 後端 (.env)

```env
# 資料庫
DATABASE_URL=postgresql://user:password@localhost:5432/taskmanager

# 認證
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# 伺服器
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173

# Rate Limit
RATE_LIMIT_MAX=1000
```

### 前端 (.env)

```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=待辦事項管理系統
```

---

## 📚 文檔導覽

| 文檔 | 路徑 | 描述 |
|------|------|------|
| **API 清單** | [docs/api/01-api-list.md](docs/api/01-api-list.md) | 所有 API 端點詳細說明 |
| **測試列表** | [docs/testing/01-test-list.md](docs/testing/01-test-list.md) | 現有測試項目總覽 |
| **使用手冊** | [docs/user/01-user-guide.md](docs/user/01-user-guide.md) | 一般用戶操作指南 |

---

## ☁️ 部署

### Docker Compose (推薦)

```bash
docker-compose up -d
```

### 手動部署

**前端 (Vercel)**
1. 推送程式碼到 GitHub
2. 在 Vercel 控制台導入倉庫
3. 設定建構命令：`npm run build`
4. 設定輸出目錄：`dist`
5. 設定環境變數

**後端 (Render)**
1. 推送程式碼到 GitHub
2. 在 Render 控制台創建 Web Service
3. 連接 GitHub 倉庫
4. 設定建構命令：`npm install && npm run build`
5. 設定啟動命令：`npm start`
6. 設定環境變數

**資料庫 (Render PostgreSQL / Supabase)**
1. 創建 PostgreSQL 資料庫
2. 取得連接字串
3. 設定 `DATABASE_URL` 環境變數
4. 執行 `npx prisma migrate deploy`

---

## 📄 授權

本專案採用 MIT 授權 - 請參閱 [LICENSE](LICENSE) 檔案

---

## 🔧 開發命令

```bash
# 前端
cd frontend
npm run dev          # 開發模式
npm run build        # 建構生產版本
npm run test         # 執行單元測試
npm run test:e2e     # 執行 E2E 測試

# 後端
cd backend
npm run dev          # 開發模式
npm run build        # 建構
npm run start        # 生產模式
npm run test         # 執行測試
npx prisma studio    # 開啟資料庫管理介面
```
