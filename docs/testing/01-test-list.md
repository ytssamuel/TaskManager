# 測試項目列表

> **最後更新**: 2026-03-28 | **版本**: v1.0.0

---

## 目錄

- [測試架構](#測試架構)
- [後端單元測試 (Backend Unit)](#後端單元測試-backend-unit)
- [後端整合測試 (Backend Integration)](#後端整合測試-backend-integration)
- [前端單元測試 (Frontend Unit)](#前端單元測試-frontend-unit)
- [端對端測試 (E2E)](#端對端測試-e2e)
- [測試執行指令](#測試執行指令)
- [覆蓋範圍摘要](#覆蓋範圍摘要)

---

## 測試架構

```
todo-app/
├── backend/
│   └── src/
│       └── __tests__/
│           ├── auth.test.ts          # 認證工具測試
│           ├── integration.test.ts   # 整合測試
│           └── task-api.test.ts      # 任務 API 測試
│
├── frontend/
│   ├── src/
│   │   └── __tests__/
│   │       ├── App.test.tsx          # 前端元件測試
│   │       └── setup.ts             # 測試設定
│   └── e2e/
│       ├── auth.spec.ts             # 認證流程 E2E
│       ├── project.spec.ts          # 專案流程 E2E
│       ├── task.spec.ts             # 任務流程 E2E
│       ├── comment.spec.ts          # 留言流程 E2E
│       ├── theme.spec.ts            # 主題切換 E2E
│       ├── login.spec.ts             # 登入 E2E
│       └── home.spec.ts             # 首頁 E2E
```

---

## 後端單元測試 (Backend Unit)

### 檔案: `backend/src/__tests__/auth.test.ts`

| 測試群組 | 測試項目 | 描述 |
|----------|----------|------|
| **Password Hashing** | should hash a password correctly | 密碼雜湊正確 |
| **Password Hashing** | should verify correct password | 正確密碼驗證 |
| **Password Hashing** | should reject incorrect password | 錯誤密碼拒絕 |
| **JWT Token** | should generate a valid token | 產生有效 JWT |
| **JWT Token** | should verify a valid token | 驗證有效 JWT |
| **JWT Token** | should reject invalid token | 拒絕無效 JWT |
| **Register Schema** | should validate valid register data | 驗證有效註冊資料 |
| **Register Schema** | should reject invalid email | 拒絕無效 email |
| **Register Schema** | should reject short password | 拒絕過短密碼 |
| **Project Schema** | should validate valid project data | 驗證有效專案資料 |
| **Project Schema** | should reject empty project name | 拒絕空專案名稱 |
| **Response Utilities** | should create success response | 成功回應格式 |
| **Response Utilities** | should create error response | 錯誤回應格式 |
| **Helper Functions** | should extract token from Bearer header | 解析 Bearer token |
| **Helper Functions** | should return null for missing Bearer header | 處理無 token 情況 |

---

## 後端整合測試 (Backend Integration)

### 檔案: `backend/src/__tests__/integration.test.ts`

| 測試群組 | 測試項目 | 描述 |
|----------|----------|------|
| **Auth Integration** | User registration flow | 註冊流程整合 |
| **Auth Integration** | User login flow | 登入流程整合 |
| **Auth Integration** | Invalid credentials rejection | 無效憑證拒絕 |
| **Project Integration** | Create and retrieve project | 創建與取得專案 |
| **Project Integration** | Project authorization | 專案授權檢查 |

### 檔案: `backend/src/__tests__/task-api.test.ts`

| 測試群組 | 測試項目 | 描述 |
|----------|----------|------|
| **Task API** | should create a task | 建立任務 |
| **Task API** | should get tasks by project | 依專案取得任務 |
| **Task API** | should reject task without title | 拒絕無標題任務 |
| **Project API** | should get empty project list | 取得空專案列表 |
| **Project API** | should reject empty project name | 拒絕空專案名稱 |

---

## 前端單元測試 (Frontend Unit)

### 檔案: `frontend/src/__tests__/App.test.tsx`

| 測試群組 | 測試項目 | 描述 |
|----------|----------|------|
| **Login Page** | renders login form elements | 登入表單渲染 |
| **Login Page** | has a register link | 登入頁有註冊連結 |
| **Register Page** | renders register form elements | 註冊表單渲染 |
| **Register Page** | has a login link | 註冊頁有登入連結 |
| **Dashboard Page** | shows dashboard title | 儀表板標題顯示 |
| **Utility Functions** | formats initials correctly | 姓名縮寫格式化 |
| **Utility Functions** | validates email format | Email 格式驗證 |
| **Utility Functions** | validates password strength | 密碼強度驗證 |
| **Utility Functions** | formats date correctly | 日期格式化 |
| **Utility Functions** | generates priority colors | 優先級顏色產生 |
| **Utility Functions** | generates status colors | 狀態顏色產生 |
| **Utility Functions** | gets status labels | 取得狀態標籤 |
| **Utility Functions** | gets priority labels | 取得優先級標籤 |

---

## 端對端測試 (E2E)

使用 Playwright 進行瀏覽器自動化測試。

### 檔案: `frontend/e2e/auth.spec.ts`

| 測試項目 | 描述 |
|----------|------|
| registration flow | 完整註冊流程 |
| login flow | 完整登入流程 |
| unauthorized access redirect | 未授權存取重新導向 |

### 檔案: `frontend/e2e/project.spec.ts`

| 測試項目 | 描述 |
|----------|------|
| create new project | 建立新專案 |
| edit project | 編輯專案 |
| delete project | 刪除專案 |
| project board loads | 專案看板載入 |

### 檔案: `frontend/e2e/task.spec.ts`

| 測試項目 | 描述 |
|----------|------|
| create task | 建立任務 |
| edit task | 編輯任務 |
| delete task | 刪除任務 |
| move task | 移動任務 |
| task dependencies | 任務依賴 |

### 檔案: `frontend/e2e/comment.spec.ts`

| 測試項目 | 描述 |
|----------|------|
| add comment | 新增留言 |
| edit comment | 編輯留言 |
| delete comment | 刪除留言 |

### 檔案: `frontend/e2e/theme.spec.ts`

| 測試項目 | 描述 |
|----------|------|
| theme toggle | 主題切換 |
| system theme follow | 跟隨系統主題 |
| theme persistence | 主題持久化 |

### 檔案: `frontend/e2e/login.spec.ts`

| 測試項目 | 描述 |
|----------|------|
| login page loads | 登入頁載入 |
| login validation | 登入驗證 |

### 檔案: `frontend/e2e/home.spec.ts`

| 測試項目 | 描述 |
|----------|------|
| home page loads | 首頁載入 |
| navigation | 導航功能 |

---

## 測試執行指令

### 後端測試

```bash
cd backend
npm run test
```

### 前端單元測試

```bash
cd frontend
npm run test
```

### 前端 E2E 測試

```bash
cd frontend
npm run test:e2e           # 執行所有 E2E 測試
npm run test:e2e:ui        # 開啟 Playwright UI
npm run test:e2e:headed    # 在瀏覽器中執行
```

---

## 覆蓋範圍摘要

| 模組 | 單元測試 | 整合測試 | E2E |
|------|----------|----------|-----|
| 認證 (Auth) | ✅ | ✅ | ✅ |
| 專案 (Project) | ✅ | ✅ | ✅ |
| 任務 (Task) | ✅ | ✅ | ✅ |
| 看板列 (Column) | - | - | - |
| 任務指派 (Assignee) | - | - | - |
| 任務留言 (Comment) | - | - | ✅ |
| 邀請 (Invite) | - | - | - |
| 主題 (Theme) | - | - | ✅ |
| API Key | - | - | - |

**圖例:**
- ✅ = 已覆蓋
- - = 未覆蓋

### 待加強測試區塊

1. **看板列 (Column)** - 缺少單元測試和 E2E
2. **任務指派 (Assignee)** - 缺少各類測試
3. **邀請系統 (Invite)** - 缺少各類測試
4. **API Key 管理** - 缺少各類測試
5. **錯誤處理** - 各模組的錯誤情況覆蓋不足
6. **權限檢查** - 未登入/無權限情況覆蓋不足
