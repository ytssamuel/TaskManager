# Frontend 新功能規劃

## 現有頁面
- `Login.tsx` - 登入
- `Register.tsx` - 註冊
- `Dashboard.tsx` - 儀表板
- `ProjectList.tsx` - 專案列表
- `ProjectBoard.tsx` - 專案看板
- `Profile.tsx` - 個人資料
- `ApiTest.tsx` - API 測試

## 新增功能

### 1. API Key 管理 (pages/ApiKeys.tsx)
| 功能 | 說明 |
|------|------|
| 建立 API Key | 輸入名稱，產生 Key |
| 列表 API Keys | 顯示所有 Key |
| 複製 Key | 一鍵複製到剪貼簿 |
| 刪除 API Key | 刪除現有 Key |

**API**:
- `GET /api/keys` - 列表
- `POST /api/keys` - 建立
- `DELETE /api/keys/:id` - 刪除

### 2. 任務摘要儀表板 (components/TaskSummary.tsx)
| 功能 | 說明 |
|------|------|
| 統計卡片 | 總任務數、已完成、進行中、待辦 |
| 圓環圖 | 顯示進度百分比 |
| RWD | 手機/平板/桌面自适应 |

**API**:
- `GET /api/projects/:id/tasks/summary`

### 3. 邀請系統 (components/InviteModal.tsx)
| 功能 | 說明 |
|------|------|
| 產生邀請 | 選擇權限 (ADMIN/MEMBER) |
| 複製連結 | 一鍵複製邀請連結 |
| 邀請列表 | 顯示所有邀請 |
| 取消邀請 | 撤銷未接受邀請 |

**API**:
- `POST /api/invites` - 建立
- `GET /api/invites/:token` - 驗證
- `POST /api/invites/:token/accept` - 接受
- `DELETE /api/invites/:id` - 取消

### 4. 多人指派 (components/TaskAssignees.tsx)
| 功能 | 說明 |
|------|------|
| 選擇負責人 | 從專案成員中選擇 |
| 顯示多個頭像 | 並排顯示負責人頭像 |
| 移除負責人 | 點擊移除 |

**API**:
- `POST /api/tasks/:id/assignees` - 新增
- `GET /api/tasks/:id/assignees` - 列表
- `DELETE /api/tasks/:id/assignees/:userId` - 移除

---

## 實作順序

1. **API Key 管理** - 最簡單，直接可用
2. **任務摘要** - Dashboard 增強
3. **邀請系統** - 需要 Modal
4. **多人指派** - TaskCard 改造

---

## 技術重點

- 使用現有 UI Components (Dialog, Card, Avatar, Badge)
- RWD 支援 (Tailwind responsive classes)
- 錯誤處理 (toast notifications)
- Loading states
