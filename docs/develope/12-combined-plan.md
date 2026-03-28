# TaskManager 開發總規劃 - AI + 多人協作

## 🎯 願景

建立一個 AI 驅動的專案管理系統，同時支援團隊協作與 AI 助手。

---

## 📋 功能整合

### 多人協作（核心）
- 成員管理（邀請/權限）
- 活動日誌
- 任務指派（多人）

### AI 協作（特色）
- API Key 認證
- 自然語言建任務
- 任務摘要
- AI Bot 身份

---

## 🗓️ 開發順序

### Phase 1：共享基礎設施 ⚡

**目標**：多人協作 + AI 都需要的底層

| 順序 | 功能 | 說明 |
|------|------|------|
| 1.1 | **ApiKey 資料表** | 新增 ApiKey 模型 |
| 1.2 | **API Key 管理 API** | 建立/列表/刪除 |
| 1.3 | **活動日誌資料表** | Activity 模型 |
| 1.4 | **活動日誌 API** | 記錄項目/任務操作 |

**理由**：這些是兩個功能的共用基礎，先做好省工

---

### Phase 2：多人協作 🧑‍🤝‍🧑

**目標**：團隊協作核心功能

| 順序 | 功能 | 說明 |
|------|------|------|
| 2.1 | **邀請系統** | 產生邀請連結、接受邀請 |
| 2.2 | **成員權限細分** | OWNER/ADMIN/MEMBER/VIEWER |
| 2.3 | **任務指派多人** | 一個任務可多人負責 |

---

### Phase 3：AI 協作 🤖

**目標**：讓我可以幫你管理任務

| 順序 | 功能 | 說明 |
|------|------|------|
| 3.1 | **API Key 驗證 Middleware** | 支援 Bearer Token |
| 3.2 | **任務 CRUD API** | 完整任務 API |
| 3.3 | **任務摘要 API** | 統計數據 |
| 3.4 | **自然語言解析** | 文字 → 任務 |
| 3.5 | **OpenClaw 整合** | 讓我可以呼叫 API |

---

### Phase 4：自動化 ⏰

**目標**：定時推送

| 順序 | 功能 | 說明 |
|------|------|------|
| 4.1 | **每日摘要 Cron** | 每天早上推送到 Telegram |
| 4.2 | **到期提醒** | 任務到期前提醒 |

---

## 📊 開發矩陣

```
         Phase 1    Phase 2    Phase 3    Phase 4
         ────────    ────────    ────────    ────────
多人協作   ████████    ████████    (完成)     -
AI 協作    ████████    (完成)     ████████    ████████
```

---

## 🔧 實作細節

### Phase 1 共用基礎

```prisma
// ApiKey 表
model ApiKey {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  name      String   // "小小羊的機器人"
  key       String   @unique // tm_live_xxxxx
  createdAt DateTime @default(now())
  lastUsedAt DateTime?
}

// Activity 表
model Activity {
  id          String   @id @default(uuid())
  type        String   // TASK_CREATED, TASK_UPDATED, etc.
  projectId   String
  taskId     String?
  userId     String
  description String
  createdAt  DateTime @default(now())
}
```

---

### Phase 2 多人協作

- 邀請連結產生（短碼+UUID）
- 成員權限檢查 Middleware
- 任務多指派人

---

### Phase 3 AI 協作

- Bearer Token 驗證
- `/api/tasks/summary` 端點
- 自然語言 prompt → 任務轉換

---

### Phase 4 自動化

- OpenClaw Cron Job
- 每日 9:00 執行
- 推送到 Telegram

---

## ✅ 驗收標準

### Phase 1
- [ ] ApiKey 可建立/刪除
- [ ] Activity 記錄會寫入

### Phase 2
- [ ] 邀請連結可運作
- [ ] 成員權限正確

### Phase 3
- [ ] API Key 可成功呼叫 API
- [ ] 我可以建立任務

### Phase 4
- [ ] 每日摘要推送到 Telegram

---

## ❓ 確認

這個開發順序可以嗎？確認後我就開始實作 Phase 1！
