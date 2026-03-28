# API 設計規格

## 1. API 分組

| 分組 | 用途 |
|------|------|
| `/api/tasks` | 任務 CRUD + 狀態/排序 |
| `/api/tasks/:id/subtasks` | 父子任務管理 |
| `/api/tasks/merge` | 任務合併 |
| `/api/tasks/:id/split` | 任務拆分 |
| `/api/projects/from-tasks` | 從任務建立專案 |

---

## 2. 父子任務 API

### 2.1 取得子任務列表

```
GET /api/tasks/:id/subtasks
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "subtasks": [
      {
        "id": "uuid",
        "title": "子任務標題",
        "status": "BACKLOG",
        "priority": "MEDIUM",
        "childCount": 0
      }
    ],
    "totalCount": 1
  }
}
```

### 2.2 建立子任務

```
POST /api/tasks/:id/subtasks
```

**Request**
```json
{
  "title": "新子任務",
  "description": "optional",
  "priority": "MEDIUM",
  "status": "BACKLOG"
}
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "新子任務",
    "parentTaskId": "{parentId}",
    "status": "BACKLOG",
    "priority": "MEDIUM"
  }
}
```

### 2.3 移動任務到新的父任務

```
PUT /api/tasks/:id/parent
```

**Request**
```json
{
  "parentTaskId": "uuid | null"
}
```
- `parentTaskId` 為 `null` 表示設為根任務

**Response 200**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "parentTaskId": "uuid or null"
  }
}
```

---

## 3. 任務合併 API

### 3.1 預覽合併結果

```
POST /api/tasks/merge-preview
```

**Request**
```json
{
  "taskIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "conflicts": [
      {
        "field": "priority",
        "values": [
          { "taskId": "uuid1", "value": "HIGH" },
          { "taskId": "uuid2", "value": "LOW" },
          { "taskId": "uuid3", "value": "MEDIUM" }
        ],
        "suggestedValue": "HIGH"
      },
      {
        "field": "assignees",
        "values": [
          { "taskId": "uuid1", "value": [{ "id": "user1", "name": "張三" }] },
          { "taskId": "uuid2", "value": [{ "id": "user2", "name": "李四" }] }
        ],
        "suggestedValue": [{ "id": "user1", "name": "張三" }, { "id": "user2", "name": "李四" }]
      }
    ],
    "preview": {
      "title": "合併後的標題（第一個任務的標題）",
      "description": "合併後的描述（所有描述用 \\n---\\n 分隔）",
      "priority": "HIGH",
      "status": "IN_PROGRESS",
      "assignees": [{ "id": "user1" }, { "id": "user2" }],
      "dependencies": ["uuid1", "uuid2"]
    }
  }
}
```

### 3.2 執行合併

```
POST /api/tasks/merge
```

**Request**
```json
{
  "taskIds": ["uuid1", "uuid2", "uuid3"],
  "mergedData": {
    "title": "用戶選擇的標題",
    "description": "用戶編輯後的描述",
    "priority": "HIGH",
    "status": "IN_PROGRESS",
    "assigneeIds": ["user1", "user2"],
    "dueDate": "2024-12-31T00:00:00Z"
  }
}
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "mergedTask": {
      "id": "new-uuid",
      "title": "合併後的標題",
      "status": "IN_PROGRESS",
      "assignees": [...]
    },
    "sourceTaskIds": ["uuid1", "uuid2", "uuid3"]
  }
}
```

---

## 4. 任務拆分 API

### 4.1 預覽拆分結果

```
POST /api/tasks/:id/split-preview
```

**Request**
```json
{
  "splitPoints": [100, 250]
}
```
- `splitPoints` 為 description 字串中的分割位置陣列

**Response 200**
```json
{
  "success": true,
  "data": {
    "splits": [
      {
        "title": "任務標題 (1/3)",
        "description": "第1段內容"
      },
      {
        "title": "任務標題 (2/3)",
        "description": "第2段內容"
      },
      {
        "title": "任務標題 (3/3)",
        "description": "第3段內容"
      }
    ]
  }
}
```

### 4.2 執行拆分

```
POST /api/tasks/:id/split
```

**Request**
```json
{
  "splits": [
    {
      "title": "新任務標題 1",
      "description": "第1段內容",
      "priority": "MEDIUM"
    },
    {
      "title": "新任務標題 2",
      "description": "第2段內容",
      "priority": "HIGH"
    }
  ]
}
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "newTasks": [
      {
        "id": "new-uuid-1",
        "title": "新任務標題 1",
        "description": "第1段內容",
        "parentTaskId": null,
        "status": "BACKLOG"
      },
      {
        "id": "new-uuid-2",
        "title": "新任務標題 2",
        "description": "第2段內容",
        "parentTaskId": null,
        "status": "BACKLOG"
      }
    ],
    "sourceTaskId": "original-uuid"
  }
}
```

---

## 5. 轉為專案 API

### 5.1 從任務建立新專案

```
POST /api/projects/from-tasks
```

**Request**
```json
{
  "projectName": "新專案名稱",
  "projectDescription": "可選的專案描述",
  "taskIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "new-project-uuid",
      "name": "新專案名稱",
      "description": "可選的專案描述"
    },
    "movedTasks": [
      {
        "id": "uuid1",
        "title": "任務1",
        "projectId": "new-project-uuid"
      },
      {
        "id": "uuid2",
        "title": "任務2",
        "projectId": "new-project-uuid"
      }
    ],
    "deletedTaskIds": []
  }
}
```

---

## 6. 錯誤回應格式

所有錯誤均遵循統一格式：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "人類可讀的錯誤訊息",
    "details": {}
  }
}
```

### 常見錯誤碼

| Code | HTTP Status | 說明 |
|------|-------------|------|
| `TASK_NOT_FOUND` | 404 | 任務不存在 |
| `CIRCULAR_DEPENDENCY` | 400 | 檢測到循環依賴 |
| `MERGE_SELF_REFERENCE` | 400 | 任務不能依賴自己 |
| `CROSS_PROJECT_DEPENDENCY` | 400 | 嘗試跨專案依賴 |
| `PERMISSION_DENIED` | 403 | 無權限執行此操作 |
| `VALIDATION_ERROR` | 400 | 請求參數驗證失敗 |
