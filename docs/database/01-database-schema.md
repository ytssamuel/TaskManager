# 資料庫 Schema 文檔

> **最後更新**: 2026-03-28 | **版本**: v1.0.0

---

## 目錄

- [概覽](#概覽)
- [實體關係圖](#實體關係圖)
- [資料表詳細說明](#資料表詳細說明)
- [列舉類型](#列舉類型)
- [索引設計](#索引設計)
- [關聯關係](#關聯關係)

---

## 概覽

| 項目 | 技術 |
|------|------|
| 資料庫 | PostgreSQL 15+ |
| ORM | Prisma 5+ |
| 產生地點 | `backend/prisma/schema.prisma` |

---

## 實體關係圖

```
┌─────────┐       ┌─────────────────┐       ┌─────────────┐
│  User   │──────<│  ProjectMember   │>──────│   Project   │
└─────────┘       └─────────────────┘       └─────────────┘
     │                                            │
     │                                            │
     ├──────────────────┬─────────────────────────┤
     │                  │                         │
     ▼                  ▼                         ▼
┌─────────┐       ┌─────────┐             ┌─────────────┐
│  Task   │──────<│   Column │             │  Project    │
└─────────┘       └─────────┘             │   Invite    │
     │                                    └─────────────┘
     │
     ├──< TaskDependency >──┐
     │                      │
     ▼                      ▼
┌─────────┐          ┌──────────────┐
│  Task   │          │ TaskComment  │
└─────────┘          └──────────────┘
                           │
                           ▼
                      ┌──────────┐
                      │ Activity │
                      └──────────┘
                           │
                           ▼
                      ┌─────────┐
                      │ ApiKey  │
                      └─────────┘
```

---

## 資料表詳細說明

### User (用戶)

| 欄位 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | String (UUID) | PK, @default(uuid()) | 主鍵 |
| email | String | UNIQUE | 電子郵件 |
| username | String | UNIQUE | 使用者名稱 |
| password | String | - | 密碼（已雜湊） |
| name | String? | - | 顯示名稱 |
| avatarUrl | String? | - | 頭像 URL |
| createdAt | DateTime | @default(now()) | 建立時間 |
| updatedAt | DateTime | @updatedAt | 更新時間 |

**關聯:**
- 1:N → `ProjectMember` (成員身份)
- 1:N → `Project` (擁有的專案)
- 1:N → `Task` (指派的任務)
- 1:N → `Task` (建立的任務)
- N:N → `Task` (多個指派)
- 1:N → `ApiKey`
- 1:N → `Activity`
- 1:N → `ProjectInvite`
- 1:N → `TaskComment`

---

### Project (專案)

| 欄位 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | String (UUID) | PK, @default(uuid()) | 主鍵 |
| name | String | - | 專案名稱 |
| description | String? | - | 專案描述 |
| createdAt | DateTime | @default(now()) | 建立時間 |
| updatedAt | DateTime | @updatedAt | 更新時間 |
| ownerId | String | FK → User | 擁有者 ID |

**關聯:**
- 1:N → `ProjectMember`
- 1:N → `Task`
- 1:N → `Column`
- 1:N → `Activity`
- 1:N → `ProjectInvite`
- 1:N → `ApiKey`

---

### ProjectMember (專案成員)

| 欄位 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | String (UUID) | PK, @default(uuid()) | 主鍵 |
| role | Role | @default(MEMBER) | 角色 |
| joinedAt | DateTime | @default(now()) | 加入時間 |
| projectId | String | FK → Project, ON DELETE CASCADE | 專案 ID |
| userId | String | FK → User, ON DELETE CASCADE | 用戶 ID |

**約束:**
- `@@unique([projectId, userId])` - 同一用戶不能重複加入同一專案

**關聯:**
- N:1 → `Project`
- N:1 → `User`

---

### ProjectInvite (專案邀請)

| 欄位 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | String (UUID) | PK, @default(uuid()) | 主鍵 |
| email | String | - | 邀請的 Email |
| role | MemberRole | @default(MEMBER) | 加入後的角色 |
| token | String | UNIQUE | 邀請連結 token |
| expiresAt | DateTime | - | 過期時間 |
| createdAt | DateTime | @default(now()) | 建立時間 |
| acceptedAt | DateTime? | - | 接受時間 |
| projectId | String | FK → Project, ON DELETE CASCADE | 專案 ID |
| createdById | String | FK → User | 邀請人 ID |

**關聯:**
- N:1 → `Project`
- N:1 → `User`

---

### Task (任務)

| 欄位 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | String (UUID) | PK, @default(uuid()) | 主鍵 |
| title | String | - | 任務標題 |
| description | String? | - | 任務描述 |
| status | TaskStatus | @default(BACKLOG) | 狀態 |
| priority | Priority | @default(MEDIUM) | 優先級 |
| orderIndex | Int | @default(0) | 排序索引 |
| dueDate | DateTime? | - | 截止日期 |
| projectId | String | FK → Project, ON DELETE CASCADE | 專案 ID |
| assigneeId | String? | FK → User, ON DELETE SET NULL | 主要負責人 |
| createdById | String | FK → User | 建立者 ID |
| createdAt | DateTime | @default(now()) | 建立時間 |
| updatedAt | DateTime | @updatedAt | 更新時間 |

**關聯:**
- N:1 → `Project`
- N:1 → `User` (assignee)
- N:1 → `User` (creator)
- N:N → `User` (assignees - 多人指派)
- 1:N → `TaskDependency` (dependentOn)
- 1:N → `TaskDependency` (dependencies)
- 1:N → `Activity`
- 1:N → `TaskComment`

---

### TaskDependency (任務依賴)

| 欄位 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | String (UUID) | PK, @default(uuid()) | 主鍵 |
| taskId | String | FK → Task, ON DELETE CASCADE | 任務 ID |
| dependsOnId | String | FK → Task, ON DELETE CASCADE | 依賴的任務 ID |

**約束:**
- `@@unique([taskId, dependsOnId])` - 同一依賴關係不能重複

**關聯:**
- N:1 → `Task` (dependentTask)
- N:1 → `Task` (dependsOnTask)

---

### Column (看板列)

| 欄位 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | String (UUID) | PK, @default(uuid()) | 主鍵 |
| name | String | - | 列名稱 |
| orderIndex | Int | @default(0) | 排序索引 |
| isLocked | Boolean | @default(false) | 是否鎖定 |
| projectId | String | FK → Project, ON DELETE CASCADE | 專案 ID |

**關聯:**
- N:1 → `Project`

---

### ApiKey (API 金鑰)

| 欄位 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | String (UUID) | PK, @default(uuid()) | 主鍵 |
| name | String | - | 金鑰名稱 |
| key | String | UNIQUE | 金鑰值前綴 `tm_live_` |
| role | ApiKeyRole | @default(MEMBER) | 權限角色 |
| createdAt | DateTime | @default(now()) | 建立時間 |
| lastUsedAt | DateTime? | - | 最後使用時間 |
| expiresAt | DateTime? | - | 過期時間 |
| projectId | String? | FK → Project, ON DELETE CASCADE | 限定專案（可選） |
| userId | String | FK → User, ON DELETE CASCADE | 擁有者 ID |

**關聯:**
- N:1 → `User`
- N:1 → `Project` (可選)

---

### TaskComment (任務留言)

| 欄位 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | String (UUID) | PK, @default(uuid()) | 主鍵 |
| content | String | - | 留言內容 |
| taskId | String | FK → Task, ON DELETE CASCADE | 任務 ID |
| userId | String | FK → User, ON DELETE CASCADE | 留言者 ID |
| createdAt | DateTime | @default(now()) | 建立時間 |
| updatedAt | DateTime | @updatedAt | 更新時間 |

**關聯:**
- N:1 → `Task`
- N:1 → `User`

---

### Activity (活動日誌)

| 欄位 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | String (UUID) | PK, @default(uuid()) | 主鍵 |
| type | String | - | 活動類型 |
| description | String | - | 活動描述 |
| metadata | Json? | - | 額外資料 |
| createdAt | DateTime | @default(now()) | 建立時間 |
| userId | String | FK → User, ON DELETE CASCADE | 操作者 ID |
| projectId | String | FK → Project, ON DELETE CASCADE | 專案 ID |
| taskId | String? | FK → Task, ON DELETE CASCADE | 任務 ID（可選） |

**關聯:**
- N:1 → `User`
- N:1 → `Project`
- N:1 → `Task` (可選)

---

## 列舉類型

### Role (專案成員角色)

| 值 | 說明 |
|----|------|
| OWNER | 擁有者，專案最高權限 |
| ADMIN | 管理員，可管理成員和任務 |
| MEMBER | 成員，基本操作權限 |

---

### MemberRole (邀請角色)

| 值 | 說明 |
|----|------|
| ADMIN | 管理員 |
| MEMBER | 成員 |

---

### ApiKeyRole (API Key 權限)

| 值 | 說明 |
|----|------|
| READ_ONLY | 僅讀取 |
| MEMBER | 讀寫（不含刪除） |
| ADMIN | 讀寫 + 管理成員 |
| OWNER | 全部權限 |

---

### TaskStatus (任務狀態)

| 值 | 說明 | 中文 |
|------|------|------|
| BACKLOG | 待整理 | 待整理 |
| READY | 準備開始 | 準備開始 |
| IN_PROGRESS | 進行中 | 進行中 |
| REVIEW | 待審核 | 待審核 |
| DONE | 已完成 | 已完成 |

---

### Priority (任務優先級)

| 值 | 說明 | 中文 |
|------|------|------|
| LOW | 低 | 低 |
| MEDIUM | 中 | 中 |
| HIGH | 高 | 高 |
| URGENT | 緊急 | 緊急 |

---

## 索引設計

### 主動建立的索引

| 資料表 | 索引名稱 | 欄位 | 類型 |
|--------|----------|------|------|
| users | users_email_key | email | UNIQUE |
| users | users_username_key | username | UNIQUE |
| project_members | project_members_project_id_user_id_key | projectId, userId | UNIQUE |
| task_dependencies | task_dependencies_task_id_depends_on_id_key | taskId, dependsOnId | UNIQUE |
| api_keys | api_keys_key_key | key | UNIQUE |

### Prisma 自動管理的關聯索引

| 資料表 | 索引名稱 | 欄位 |
|--------|----------|------|
| project_members | ProjectMember_projectId | projectId |
| project_members | ProjectMember_userId | userId |
| tasks | Task_projectId | projectId |
| tasks | Task_assigneeId | assigneeId |
| tasks | Task_createdById | createdById |
| task_dependencies | TaskDependency_taskId | taskId |
| task_dependencies | TaskDependency_dependsOnId | dependsOnId |
| task_comments | TaskComment_taskId | taskId |
| task_comments | TaskComment_userId | userId |
| activities | Activity_userId | userId |
| activities | Activity_projectId | projectId |
| activities | Activity_taskId | taskId |
| api_keys | ApiKey_userId | userId |
| api_keys | ApiKey_projectId | projectId |
| project_invites | ProjectInvite_token_key | token |
| project_invites | ProjectInvite_projectId | projectId |

---

## 關聯關係

### User ↔ Project

```
User 1 ──────< ProjectMember >────── 1 Project
  │                                    │
  │ (owner)                            │
  └───────────< Project >──────────────┘
```

- 一個 User 可以擁有多個 Project (作為 owner)
- 一個 User 可以透過 ProjectMember 加入多個 Project
- 一個 Project 有一個 owner (User)
- 一個 Project 可以有多個 ProjectMember (User)

### Task 相關

```
User (creator) 1 ──────< Task >────── N User (assignee)
                      │
                      │
                      ├─────< TaskDependency >──────
                      │                              │
                      │                              │
                      └──────────────────────────────┘
                               (self-referential)
```

- 一個 Task 由一個 User 建立
- 一個 Task 可以指派給一個 User (assignee)
- 一個 Task 可以指派給多個 User (assignees)
- Task 可以依賴多個 Task (self-referential N:N)

### Activity 追蹤

```
User ──────< Activity >────── Project
                          │
                          └────── Task (可選)
```

- Activity 記錄 User 在 Project 上的操作
- Activity 可選關聯到特定 Task
