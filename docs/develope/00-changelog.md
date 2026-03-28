# 開發日誌 (Changelog)

> 本文件記錄專案的所有重要更新和變更歷史

---

## [v1.0.0] - 2026-02-02

### 概要
完成待辦事項管理系統的第一個正式版本，包含完整的用戶認證、專案管理、任務看板、主題切換等功能。

---

## 更新記錄

### 2026-02-02

#### 變更
- **結構調整**: 整理 SQL 遷移檔案，將 `20250130000000_add_username/migration.sql` 移動至正確的 Prisma migrations 目錄

#### 提交記錄
- `e926681` - mv sql

---

### 2026-01-31

#### 修復
- **看板頁面 Bug 修復**: 修復 `ProjectBoard.tsx` 中的問題，優化看板渲染邏輯

#### 新增功能
- **RWD 響應式設計**: 全站支援手機、平板、桌面等不同裝置
  - 新增 `ThemeToggle.tsx` 組件
  - 優化 `Layout.tsx` 響應式佈局
  - 新增 `collapsible.tsx` 可折疊組件
  - 更新各頁面的響應式樣式（Login, Register, Profile, Dashboard, ProjectList, ProjectBoard, ApiTest）
  - 新增 `@radix-ui/react-collapsible` 依賴

#### 修改的檔案
| 檔案 | 變更說明 |
|------|----------|
| `frontend/src/components/ThemeToggle.tsx` | 新增主題切換組件 |
| `frontend/src/components/layout/Layout.tsx` | 優化響應式佈局 |
| `frontend/src/components/ui/collapsible.tsx` | 新增可折疊組件 |
| `frontend/src/pages/ProjectBoard.tsx` | 優化看板響應式設計 |
| `frontend/src/pages/*.tsx` | 各頁面響應式優化 |

#### 提交記錄
- `f79cbb7` - bug fix
- `435dc4c` - adding RWD for mobile

---

### 2026-01-30

#### 新增功能

##### 個人設定頁面
- **Profile 頁面**: 完整的個人資料管理頁面
  - 查看個人資訊
  - 修改用戶名
  - 上傳/更換頭像
  - 修改密碼
  - 刪除帳號功能

- **後端支援**:
  - 頭像上傳 API（使用 Multer）
  - 密碼修改 API
  - 帳號刪除 API
  - 上傳檔案目錄 (`uploads/avatars/`)

##### 深色/淺色主題
- **ThemeProvider**: 主題上下文提供者
- **themeStore**: Zustand 狀態管理主題設定
- **三種模式**: 淺色 / 深色 / 系統跟隨

##### 自動化測試
- **前端測試**: 
  - 使用 Vitest + React Testing Library
  - `frontend/src/__tests__/App.test.tsx`
  - `frontend/vitest.config.ts`

- **後端測試**:
  - 使用 Vitest + Supertest
  - `backend/src/__tests__/auth.test.ts` - 認證測試
  - `backend/src/__tests__/integration.test.ts` - 整合測試
  - `backend/vitest.config.ts`

#### 修改的檔案
| 檔案 | 變更說明 |
|------|----------|
| `frontend/src/pages/Profile.tsx` | 新增個人設定頁面 |
| `frontend/src/components/providers/ThemeProvider.tsx` | 新增主題提供者 |
| `frontend/src/store/themeStore.ts` | 新增主題狀態管理 |
| `frontend/src/components/ui/alert-dialog.tsx` | 新增警告對話框組件 |
| `backend/src/controllers/auth.controller.ts` | 新增頭像上傳、密碼修改 API |
| `backend/prisma/migrations/*` | 資料庫遷移 |

#### 提交記錄
- `bd738d3` - adding setting page
- `efac906` - add dark mode

---

### 2026-01-30 (初始化)

#### 專案初始化
完成專案的基礎架構建設，包含：

##### 前端 (frontend/)
- **框架**: React 18 + Vite 5 + TypeScript 5
- **樣式**: Tailwind CSS 3 + shadcn/ui
- **狀態管理**: Zustand
- **路由**: React Router 6
- **表單**: React Hook Form + Zod
- **HTTP 客戶端**: Axios

##### 後端 (backend/)
- **框架**: Node.js 20 + Express 4 + TypeScript 5
- **ORM**: Prisma 5
- **資料庫**: PostgreSQL 15
- **認證**: JWT + bcrypt

##### 核心功能
- 用戶註冊/登入
- 專案管理（CRUD）
- 任務管理（CRUD）
- 看板視圖（Kanban Board）
- 拖拽排序
- 任務狀態流轉

##### 文件結構
- `docs/01-project-overview.md` - 專案概述
- `docs/02-tech-stack.md` - 技術棧
- `docs/03-database-schema.md` - 資料庫設計
- `docs/04-api-design.md` - API 設計
- `docs/05-frontend-architecture.md` - 前端架構
- `docs/06-features.md` - 功能規格
- `docs/07-deployment.md` - 部署方案
- `docs/08-development-roadmap.md` - 開發路線圖

#### 提交記錄
- `4b6fb11` - init

---

## 統計資訊

### 程式碼統計（截至 2026-02-02）

| 類別 | 數量 |
|------|------|
| 總提交次數 | 6 |
| 前端頁面 | 7 |
| 前端組件 | 15+ |
| 後端路由 | 5 |
| API 端點 | 20+ |
| 資料庫模型 | 6 |

### 主要檔案變更數

| 提交 | 變更檔案數 | 新增行數 |
|------|------------|----------|
| init | 80 | ~12,463 |
| add dark mode | 28 | ~10,025 |
| adding setting page | 18 | ~1,028 |
| adding RWD for mobile | 17 | ~354 |
| bug fix | 1 | 12 |
| mv sql | 1 | 0 |

---

## 未來計劃

### 短期目標
- [ ] 新增任務評論功能
- [ ] 新增任務附件上傳
- [ ] 新增專案活動日誌

### 中期目標
- [ ] 新增即時通知（WebSocket）
- [ ] 新增任務搜尋功能
- [ ] 優化效能（虛擬化列表）

### 長期目標
- [ ] 新增多語言支援 (i18n)
- [ ] 新增 Google/GitHub OAuth 登入
- [ ] 新增行動端 App（React Native）
