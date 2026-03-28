# TaskManager 功能擴充規劃

## 邀請系統優化

### 1.1 邀請連結網域修正
**問題**: 邀請連結顯示 localhost，而非部署網域
**解決方案**: 
- 在後端環境變數設定 `FRONTEND_URL`
- 邀請連結產生時使用此網域

### 1.2 邀請狀態管理
**功能**:
- [ ] 專案成員可查看所有邀請（含狀態：pending/accepted/expired）
- [ ] 可取消未接受的邀請
- [ ] 顯示邀請時間和過期時間

### 1.3 邀請驗證
**功能**:
- [ ] 輸入 Email 或 Username 搜尋用戶
- [ ] 檢查是否已為專案成員
- [ ] 檢查是否已有 pending 邀請
- [ ] 顯示驗證結果（存在/不存在/已邀請）

### 1.4 邀請完成後顯示
**優化**:
- [ ] 僅顯示邀請連結
- [ ] 顯示專案名稱
- [ ] 顯示邀請人資訊
- [ ] 移除不必要的表單欄位

---

## 專案管理

### 2.1 編輯專案
**功能**:
- [ ] 專案名稱可編輯
- [ ] 專案描述可編輯
- [ ] 需要權限檢查（僅 OWNER/ADMIN 可編輯）

---

## 權限系統

### 3.1 權限角色
| 角色 | 說明 |
|------|------|
| OWNER | 專案所有者，所有權限 |
| ADMIN | 管理員，可管理成員和任務 |
| MEMBER | 成員，受限的任務權限 |

### 3.2 任務權限規則
| 操作 | OWNER | ADMIN | MEMBER |
|------|-------|-------|--------|
| 新增任務 | ✅ | ✅ | ✅ (僅 Backlog) |
| 移動到 準備開始 | ✅ | ✅ | ❌ |
| 移動到 進行中 | ✅ | ✅ | ✅ |
| 移動到 待審核 | ✅ | ✅ | ✅ |
| 移動到 已完成 | ✅ | ✅ | ❌ |
| 編輯任務 | ✅ | ✅ | ❌ |
| 刪除任務 | ✅ | ✅ | ❌ |
| 指派成員 | ✅ | ✅ | ❌ |

### 3.3 API Key 權限
**功能**:
- [ ] API Key 可設定權限（ADMIN/MEMBER）
- [ ] API 根據 Key 權限執行操作

---

## 任務留言系統

### 4.1 功能設計
**資料表**:
```prisma
model TaskComment {
  id        String   @id @default(uuid())
  content   String
  taskId    String
  task      Task     @relation(fields: [taskId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**API**:
- [x] GET /api/tasks/:id/comments - 取得留言列表
- [x] POST /api/tasks/:id/comments - 新增留言
- [x] DELETE /api/tasks/:id/comments/:commentId - 刪除留言（作者或 ADMIN）

**前端**:
- [ ] 任務詳情頁顯示留言區
- [ ] 可新增/刪除留言
- [ ] 顯示留言時間和作者

---

## 開發順序

### Phase 1: 基礎修復
1. [ ] 邀請連結網域修正
2. [ ] 專案編輯功能

### Phase 2: 權限系統
3. [ ] 實作任務權限規則
4. [ ] API Key 權限

### Phase 3: 邀請系統
5. [ ] 邀請驗證
6. [ ] 邀請狀態管理

### Phase 4: 留言系統
7. [ ] 留言功能

---

## 問題確認

1. **預設欄位名稱**: 你希望用什麼中文名稱？
   - Backlog → 待整理
   - Ready → 準備開始
   - In Progress → 進行中
   - Review → 待審核
   - Done → 已完成

2. **邀請連結格式**: `/invite/:token` 還是 `/join/:token`？

3. **留言權限**: 成員是否可以刪除自己的留言？
