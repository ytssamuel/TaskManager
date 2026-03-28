# 資料庫模型設計

## 1. 現有模型結構

```
User
  └── projects (ProjectMember)
       └── tasks (Task)
            ├── dependencies (TaskDependency - self-referential)
            ├── assignees (User - many-to-many)
            ├── comments (TaskComment)
            └── activities (Activity)
```

## 2. 新增/修改的 Prisma Schema

### 2.1 父子任務關聯

```prisma
model Task {
  id          String    @id @default(uuid())
  title       String
  description String?
  status      TaskStatus @default(BACKLOG)
  priority    Priority   @default(MEDIUM)
  orderIndex  Int        @default(0)
  dueDate     DateTime?

  projectId String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  assigneeId String?
  assignee   User?   @relation("Assignee", fields: [assigneeId], references: [id], onDelete: SetNull)

  createdById String
  createdBy   User   @relation("Creator", fields: [createdById], references: [id])

  // ===== 新增欄位 =====
  parentTaskId String?   // 父任務 ID（可為空表示根任務）
  parentTask   Task?     @relation("TaskHierarchy", fields: [parentTaskId], references: [id], onDelete: Cascade)
  subtasks     Task[]    @relation("TaskHierarchy")
  // ====================

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  dependentOn TaskDependency[]  @relation("DependentTask")
  dependencies TaskDependency[] @relation("DependsOnTask")
  activities Activity[]
  assignees   User[]   @relation("TaskAssignees")
  comments    TaskComment[]

  @@map("tasks")
}
```

### 2.2 任務操作日誌（可選）

用於追蹤合併、拆分、轉專案等操作的歷史記錄。

```prisma
model TaskOperationLog {
  id          String   @id @default(uuid())
  type        String   // "MERGE" | "SPLIT" | "CONVERT_TO_PROJECT"
  sourceIds   String[] // 來源任務 IDs
  targetId    String?  // 目標任務/專案 ID
  metadata    Json?    // 額外資訊（衝突解決等）
  performedBy String
  createdAt   DateTime @default(now())

  @@map("task_operation_logs")
}
```

### 2.3 外部任務依賴（跨專案）

當任務轉為專案後，原有的跨專案依賴需要追蹤。

```prisma
model ExternalTaskDependency {
  id              String  @id @default(uuid())
  
  // 本地任務（在某個專案內）
  localTaskId     String
  localProjectId  String
  
  // 外部任務（在另一個專案/新專案內）
  externalTaskId  String
  externalProjectId String
  
  createdAt DateTime @default(now())

  @@unique([localTaskId, externalTaskId])
  @@map("external_task_dependencies")
}
```

## 3. 欄位說明

### Task.parentTaskId
- **類型**: `String?` (UUID)
- **說明**: 指向父任務的 ID，若為空則為根任務
- **約束**: 
  - 不可自我參照（不可指向自己）
  - 不可形成循環參照（A→B→C→A）
  - 刪除父任務時，子任務會級聯刪除

### Task.subtasks
- **類型**: `Task[]` (陣列)
- **說明**: 反向關聯，取得所有子任務
- **查詢**: 預設不載入，需使用 `include: { subtasks: true }`

## 4. 索引設計

```prisma
@@index([projectId, status])       // Kanban 查詢
@@index([parentTaskId])            // 父子查詢
@@index([assigneeId])              // 負責人篩選
@@index([projectId, parentTaskId]) // 階層查詢優化
```

## 5. 遷移策略

### 向後相容性
- `parentTaskId` 預設為 `null`（現有任務都是根任務）
- 所有現有 API 無需修改即可相容

### Migration Script
```bash
npx prisma migrate dev --name add_task_hierarchy
```

## 6. 現有查詢的影響

### 需要更新的查詢

| 查詢 | 影響 |
|------|------|
| `getProjectTasks` | 可選擇是否包含 subtasks |
| `getTask` | 自動載入 subtasks count |
| `searchTasks` | 可過濾 `parentTaskId: null` 只看根任務 |

### 保持不變的查詢
- `createTask` - 新任務預設為根任務
- `updateTask` - 可更新 `parentTaskId` 移動任務階層
