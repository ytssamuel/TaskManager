# 数据库设计

## 数据库选择

- **PostgreSQL** - 关系型数据库，适合结构化数据和复杂查询

## ORM

- **Prisma** - 类型安全的 ORM，提供清晰的 Schema 定义

## Schema 设计

### Users 表（用户）

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String?
  avatarUrl String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  projects        ProjectMember[]
  assignedTasks   Task[]          @relation("Assignee")
  createdTasks    Task[]          @relation("Creator")
  taskDependencies TaskDependency[] @relation("DependentTask")
  dependentTasks  TaskDependency[] @relation("DependsOnTask")

  @@map("users")
}
```

### Projects 表（项目）

```prisma
model Project {
  id          String   @id @default(uuid())
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  ownerId String
  owner   User   @relation(fields: [ownerId], references: [id])

  members  ProjectMember[]
  tasks    Task[]
  columns  Column[]

  @@map("projects")
}
```

### ProjectMembers 表（项目成员）

```prisma
model ProjectMember {
  id        String   @id @default(uuid())
  role      Role     @default(MEMBER)
  joinedAt  DateTime @default(now())

  projectId String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([projectId, userId])
  @@map("project_members")
}

enum Role {
  OWNER
  ADMIN
  MEMBER
}
```

### Tasks 表（任务）

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

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  dependentOn Task[]  @relation("DependentTask")
  dependencies Task[] @relation("DependsOnTask")

  @@map("tasks")
}

enum TaskStatus {
  BACKLOG      // 待整理
  READY        // 准备开始
  IN_PROGRESS  // 进行中
  REVIEW       // 待审核
  DONE         // 已完成
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

### TaskDependencies 表（任务依赖）

```prisma
model TaskDependency {
  id           String @id @default(uuid())

  taskId       String
  task         Task   @relation(fields: [taskId], references: [id], onDelete: Cascade)

  dependsOnId  String
  dependsOn    Task   @relation(fields: [dependsOnId], references: [id], onDelete: Cascade)

  @@unique([taskId, dependsOnId])
  @@map("task_dependencies")
}
```

### Columns 表（看板列）

```prisma
model Column {
  id        String  @id @default(uuid())
  name      String
  orderIndex Int    @default(0)
  isLocked  Boolean @default(false)

  projectId String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@map("columns")
}
```

## 索引设计

```sql
-- Users 表索引
CREATE INDEX idx_users_email ON users(email);

-- Tasks 表索引
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_order_index ON tasks(project_id, order_index);

-- ProjectMembers 表索引
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);

-- TaskDependencies 表索引
CREATE INDEX idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX idx_task_dependencies_depends_on_id ON task_dependencies(depends_on_id);
```

## 关系图

```
User 1 ── * ProjectMember * ── 1 Project
                                     │
                                     * Task *
                                     │
                                   1 Column
```
