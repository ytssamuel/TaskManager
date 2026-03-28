# API 清單

> **最後更新**: 2026-03-28 | **版本**: v1.0.0

---

## 目錄

- [認證模組 (Auth)](#認證模組-auth)
- [專案模組 (Projects)](#專案模組-projects)
- [任務模組 (Tasks)](#任務模組-tasks)
- [看板列模組 (Columns)](#看板列模組-columns)
- [任務指派模組 (Task Assignees)](#任務指派模組-task-assignees)
- [任務留言模組 (Task Comments)](#任務留言模組-task-comments)
- [邀請模組 (Invites)](#邀請模組-invites)
- [活動日誌模組 (Activities)](#活動日誌模組-activities)
- [API Key 模組 (API Keys)](#api-key-模組-api-keys)
- [API Key 認證端點 (API-Key Auth Endpoints)](#api-key-認證端點-api-key-auth-endpoints)
- [測試端點 (Test)](#測試端點-test)

---

## 認證模組 (Auth)

| 方法 | 端點 | 描述 | 認證 |
|------|------|------|------|
| POST | `/api/auth/register` | 使用者註冊 | 否 |
| POST | `/api/auth/login` | 使用者登入 | 否 |
| GET | `/api/auth/me` | 取得當前用戶資訊 | JWT |
| PUT | `/api/auth/profile` | 更新個人資料 | JWT |
| PUT | `/api/auth/password` | 修改密碼 | JWT |
| POST | `/api/auth/avatar` | 上傳頭像 | JWT |
| DELETE | `/api/auth/account` | 刪除帳號 | JWT |
| POST | `/api/auth/logout` | 登出 | 否 |

### 註冊 (POST /api/auth/register)

**請求 body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "name": "顯示名稱"
}
```

**回應:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "username": "...", "name": "..." },
    "accessToken": "jwt_token_here"
  }
}
```

### 登入 (POST /api/auth/login)

**請求 body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

---

## 專案模組 (Projects)

| 方法 | 端點 | 描述 | 認證 |
|------|------|------|------|
| GET | `/api/projects` | 取得所有專案 | JWT |
| POST | `/api/projects` | 建立專案 | JWT |
| GET | `/api/projects/:id` | 取得專案詳情 | JWT |
| PUT | `/api/projects/:id` | 更新專案 | JWT |
| DELETE | `/api/projects/:id` | 刪除專案 | JWT |
| GET | `/api/projects/:id/members` | 取得成員列表 | JWT |
| POST | `/api/projects/:id/members` | 新增成員 | JWT |
| DELETE | `/api/projects/:id/members/:userId` | 移除成員 | JWT |

---

## 任務模組 (Tasks)

| 方法 | 端點 | 描述 | 認證 |
|------|------|------|------|
| GET | `/api/tasks/search` | 搜尋任務 | JWT |
| GET | `/api/tasks/project/:projectId` | 取得專案所有任務 | JWT |
| GET | `/api/tasks/:id` | 取得任務詳情 | JWT |
| POST | `/api/tasks` | 建立任務 | JWT + API Key |
| PUT | `/api/tasks` | 更新任務 | JWT + API Key |
| PUT | `/api/tasks/:id` | 更新任務 | JWT + API Key |
| DELETE | `/api/tasks/:id` | 刪除任務 | JWT + API Key |
| PUT | `/api/tasks/:id/status` | 更新任務狀態 | JWT |
| PUT | `/api/tasks/:id/order` | 更新任務排序 | JWT |
| POST | `/api/tasks/:id/dependencies` | 新增依賴 | JWT |
| DELETE | `/api/tasks/:id/dependencies/:depId` | 移除依賴 | JWT |

### 任務狀態 (TaskStatus)

| 狀態 | 描述 | 中文 |
|------|------|------|
| BACKLOG | 待整理 | 待整理 |
| READY | 準備開始 | 準備開始 |
| IN_PROGRESS | 進行中 | 進行中 |
| REVIEW | 待審核 | 待審核 |
| DONE | 已完成 | 已完成 |

### 任務優先級 (Priority)

| 優先級 | 描述 | 中文 |
|--------|------|------|
| LOW | 低 | 低 |
| MEDIUM | 中 | 中 |
| HIGH | 高 | 高 |
| URGENT | 緊急 | 緊急 |

---

## 看板列模組 (Columns)

| 方法 | 端點 | 描述 | 認證 |
|------|------|------|------|
| GET | `/api/columns/:projectId` | 取得所有列 | JWT |
| POST | `/api/columns/:projectId` | 建立列 | JWT |
| PUT | `/api/columns/reorder` | 重新排序 | JWT |
| PUT | `/api/columns/:id` | 更新列 | JWT |
| DELETE | `/api/columns/:id` | 刪除列 | JWT |

---

## 任務指派模組 (Task Assignees)

| 方法 | 端點 | 描述 | 認證 |
|------|------|------|------|
| GET | `/api/tasks/:id/assignees` | 取得任務負責人 | JWT |
| POST | `/api/tasks/:id/assignees` | 新增負責人 | JWT |
| DELETE | `/api/tasks/:id/assignees/:userId` | 移除負責人 | JWT |

---

## 任務留言模組 (Task Comments)

| 方法 | 端點 | 描述 | 認證 |
|------|------|------|------|
| GET | `/api/tasks/:taskId/comments` | 取得留言列表 | JWT |
| POST | `/api/tasks/:taskId/comments` | 新增留言 | JWT |
| DELETE | `/api/tasks/:taskId/comments/:commentId` | 刪除留言 | JWT |

---

## 邀請模組 (Invites)

| 方法 | 端點 | 描述 | 認證 |
|------|------|------|------|
| GET | `/api/invites` | 取得專案邀請列表 | JWT |
| POST | `/api/invites` | 建立邀請 | JWT |
| GET | `/api/invites/:token` | 驗證邀請 | JWT |
| POST | `/api/invites/:token/accept` | 接受邀請 | JWT |
| DELETE | `/api/invites/:id` | 取消邀請 | JWT |

---

## 活動日誌模組 (Activities)

| 方法 | 端點 | 描述 | 認證 |
|------|------|------|------|
| GET | `/api/activities/projects/:projectId/activities` | 取得專案活動日誌 | JWT |
| GET | `/api/activities/tasks/:taskId/activities` | 取得任務活動日誌 | JWT |

---

## API Key 模組 (API Keys)

| 方法 | 端點 | 描述 | 認證 |
|------|------|------|------|
| GET | `/api/keys` | 取得所有 API Key | JWT |
| POST | `/api/keys` | 建立 API Key | JWT |
| DELETE | `/api/keys/:id` | 刪除 API Key | JWT |

### API Key 角色 (ApiKeyRole)

| 角色 | 權限 |
|------|------|
| READ_ONLY | 僅讀取 |
| MEMBER | 讀寫（不含刪除） |
| ADMIN | 讀寫 + 管理成員 |
| OWNER | 全部權限 |

---

## API Key 認證端點 (API-Key Auth Endpoints)

這些端點支援 API Key 認證，位於 `/api/` 路徑下：

| 方法 | 端點 | 描述 |
|------|------|------|
| GET | `/api/summary` | 取得任務摘要 |
| GET | `/api/projects` | 取得專案列表 |
| GET | `/api/projects/:id` | 取得專案詳情 |
| GET | `/api/projects/:id/tasks` | 取得專案任務列表 |
| GET | `/api/projects/:id/tasks/summary` | 取得專案任務摘要 |
| POST | `/api/tasks` | 建立任務 |
| GET | `/api/tasks/search` | 搜尋任務 |

---

## 測試端點 (Test)

| 方法 | 端點 | 描述 |
|------|------|------|
| GET | `/api/test` | API 資訊與端點列表 |
| GET | `/api/test/health` | 健康檢查 |
| POST | `/api/test/test` | 測試請求 |

---

## 通用回應格式

### 成功回應

```json
{
  "success": true,
  "data": { ... }
}
```

### 錯誤回應

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "錯誤訊息"
  }
}
```

### 常見錯誤碼

| 錯誤碼 | 描述 |
|--------|------|
| `AUTH_ERROR` | 認證錯誤 |
| `VALIDATION_ERROR` | 驗證錯誤 |
| `NOT_FOUND` | 資源不存在 |
| `PERMISSION_ERROR` | 權限不足 |
| `PERMISSION_DENIED` | API Key 權限不足 |
| `CONFLICT` | 資源衝突 |
| `RATE_LIMIT` | 請求過多 |

---

## 認證方式

### JWT 認證

在請求 header 中加入：
```
Authorization: Bearer <jwt_token>
```

### API Key 認證

在請求 header 中加入：
```
X-API-Key: <api_key>
```
