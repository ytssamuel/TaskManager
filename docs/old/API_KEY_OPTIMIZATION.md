# API Key 權限優化計劃

## 目標

讓 API Key 有自己的權限控制，不再繼承帳號權限

---

## 優化內容

### 1. ✅ 新增 API Key 角色

```prisma
enum ApiKeyRole {
  READ_ONLY   // 只能讀取
  MEMBER      // 讀取 + 建立
  ADMIN       // 讀取 + 建立 + 編輯
  OWNER       // 完整權限
}
```

### 2. ✅ 新增專案限定

```prisma
model ApiKey {
  // ...
  projectId String?  // 可選：限定只能訪問特定專案
  project   Project? @relation(...)
}
```

### 3. ✅ 修改 Middleware

```typescript
req.user = {
  userId: apiKey.userId,
  email: apiKey.user.email,
  isApiKey: true,
  apiKeyRole: apiKey.role,
  apiKeyProjectId: apiKey.projectId,
};
```

### 4. ✅ 權限矩陣

| 功能 | READ_ONLY | MEMBER | ADMIN | OWNER |
|------|-----------|--------|-------|-------|
| 讀取專案列表 | ✅ | ✅ | ✅ | ✅ |
| 讀取任務 | ✅ | ✅ | ✅ | ✅ |
| 建立任務 | ❌ | ✅ | ✅ | ✅ |
| 編輯任務 | ❌ | ❌ | ✅ | ✅ |
| 刪除任務 | ❌ | ❌ | ✅ | ✅ |
| 刪除專案 | ❌ | ❌ | ❌ | ✅ |

### 5. ✅ 擴充可用端點

| Endpoint | 方法 | 說明 |
|----------|------|------|
| `/api/summary` | GET | 任務摘要 |
| `/api/projects` | GET | 專案列表 |
| `/api/projects/:id` | GET | 專案詳情 |
| `/api/projects/:id/tasks` | GET | 任務列表 |
| `/api/tasks` | POST | 建立任務 |

---

## 執行順序

- [x] 修改 Prisma Schema - 新增 ApiKeyRole
- [x] 修改 API Key 建立 - 支援 role 參數 + projectId
- [x] 修改 Middleware - 傳遞 API Key role
- [x] 建立權限檢查 Helper
- [x] 應用到 API Routes
- [x] 部署測試

---

## 狀態: ✅ 完成 (2026-03-17)
