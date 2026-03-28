# API 设计

## 基础信息

- **Base URL**: `https://api.yourdomain.com`
- **认证方式**: JWT (Bearer Token)
- **内容类型**: `application/json`

## 认证模块

### 用户注册

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "用户名"
}
```

**响应 (201 Created)**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "用户名",
      "avatarUrl": null
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### 用户登录

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**响应 (200 OK)**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### 获取当前用户

```http
GET /api/auth/me
Authorization: Bearer <token>
```

**响应 (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "用户名",
    "avatarUrl": null,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 更新个人信息

```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "新名称",
  "avatarUrl": "https://..."
}
```

---

## 项目模块

### 获取所有项目

```http
GET /api/projects
Authorization: Bearer <token>
```

**响应 (200 OK)**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "项目名称",
      "description": "项目描述",
      "owner": {
        "id": "uuid",
        "name": "所有者名称",
        "avatarUrl": "https://..."
      },
      "membersCount": 5,
      "tasksCount": {
        "total": 10,
        "done": 3
      },
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 创建项目

```http
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "新项目",
  "description": "项目描述"
}
```

### 获取项目详情

```http
GET /api/projects/:id
Authorization: Bearer <token>
```

### 更新项目

```http
PUT /api/projects/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "项目新名称",
  "description": "新的描述"
}
```

### 删除项目

```http
DELETE /api/projects/:id
Authorization: Bearer <token>
```

### 添加项目成员

```http
POST /api/projects/:id/members
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "member@example.com",
  "role": "MEMBER"
}
```

### 获取项目成员列表

```http
GET /api/projects/:id/members
Authorization: Bearer <token>
```

### 移除项目成员

```http
DELETE /api/projects/:id/members/:userId
Authorization: Bearer <token>
```

---

## 任务模块

### 获取项目所有任务

```http
GET /api/projects/:id/tasks
Authorization: Bearer <token>
```

**响应 (200 OK)**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "uuid",
        "title": "任务标题",
        "description": "任务描述",
        "status": "BACKLOG",
        "priority": "MEDIUM",
        "orderIndex": 0,
        "dueDate": "2024-01-15T00:00:00Z",
        "assignee": {
          "id": "uuid",
          "name": "负责人名称",
          "avatarUrl": "https://..."
        },
        "createdBy": {
          "id": "uuid",
          "name": "创建者名称"
        },
        "dependencies": [
          {
            "id": "uuid",
            "dependsOn": {
              "id": "uuid",
              "title": "前置任务"
            }
          }
        ],
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "columns": [
      {
        "id": "uuid",
        "name": "Backlog",
        "orderIndex": 0,
        "isLocked": false
      }
    ]
  }
}
```

### 创建任务

```http
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "projectId": "project-uuid",
  "title": "新任务",
  "description": "任务描述",
  "status": "BACKLOG",
  "priority": "MEDIUM",
  "assigneeId": "user-uuid",
  "dueDate": "2024-01-15T00:00:00Z"
}
```

### 获取任务详情

```http
GET /api/tasks/:id
Authorization: Bearer <token>
```

### 更新任务

```http
PUT /api/tasks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "任务新标题",
  "description": "新的描述",
  "priority": "HIGH",
  "dueDate": "2024-01-20T00:00:00Z"
}
```

### 删除任务

```http
DELETE /api/tasks/:id
Authorization: Bearer <token>
```

### 更新任务状态

```http
PUT /api/tasks/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "IN_PROGRESS",
  "columnId": "column-uuid"
}
```

**验证规则**:
- 如果任务所在列是锁定的 `isLocked: true`
- 检查是否有未完成的依赖任务
- 检查同一列中是否有更小 `orderIndex` 的未完成任务

**响应 (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "IN_PROGRESS",
    "previousStatus": "READY",
    "lockedBy": {
      "taskId": "uuid",
      "title": "前置任务标题"
    } || null
  }
}
```

### 更新任务排序

```http
PUT /api/tasks/:id/order
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderIndex": 2,
  "columnId": "column-uuid"
}
```

### 添加任务依赖

```http
POST /api/tasks/:id/dependencies
Authorization: Bearer <token>
Content-Type: application/json

{
  "dependsOnId": "task-uuid"
}
```

### 移除任务依赖

```http
DELETE /api/tasks/:id/dependencies/:depId
Authorization: Bearer <token>
```

---

## 看板列模块

### 获取项目所有列

```http
GET /api/projects/:id/columns
Authorization: Bearer <token>
```

### 创建列

```http
POST /api/projects/:id/columns
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "新列名",
  "isLocked": true
}
```

### 更新列

```http
PUT /api/columns/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "列新名称",
  "isLocked": false
}
```

### 删除列

```http
DELETE /api/columns/:id
Authorization: Bearer <token>
```

### 重新排序列

```http
PUT /api/columns/reorder
Authorization: Bearer <token>
Content-Type: application/json

{
  "columns": [
    { "id": "col-uuid-1", "orderIndex": 0 },
    { "id": "col-uuid-2", "orderIndex": 1 }
  ]
}
```

---

## 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "邮箱格式不正确",
    "details": {
      "email": "必须是有效的邮箱地址"
    }
  }
}
```

### 错误码列表

| 错误码 | 描述 |
|--------|------|
| VALIDATION_ERROR | 请求参数验证失败 |
| AUTH_ERROR | 认证失败 |
| PERMISSION_ERROR | 权限不足 |
| NOT_FOUND | 资源不存在 |
| CONFLICT | 资源冲突 |
| INTERNAL_ERROR | 服务器内部错误 |
| TASK_LOCKED | 任务被锁定，无法移动 |
