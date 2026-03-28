# 轉為專案功能

## 1. 功能概述

將選定的任務轉換為新專案，任務從原專案移至新專案。

## 2. 使用情境

| 情境 | 說明 |
|------|------|
| 子專案獨立 | 專案中某部分工作發展成獨立專案 |
| 專案擴展 | 任務集合需要更獨立的資源管理 |
| 組織重構 | 需要將工作範圍重新組織 |

## 3. 使用者決策

**原任務處理方式：移入新專案**
- 任務從原專案刪除
- 任務加入到新專案
- 所有關聯資料隨之轉移

## 4. 商業規則

### 4.1 轉換條件
- 至少選擇 1 個任務
- 用戶需有新專案的建立權限
- 新專案名稱不可為空

### 4.2 資料轉移

| 資料 | 處理方式 |
|------|----------|
| 任務本體 | 移動到新專案（更新 projectId） |
| 子任務 | 隨父任務移動 |
| 留言 | 隨任務移動 |
| 負責人 | 如果是新專案成員，保留；否則移除 |
| 依賴（同專案） | 隨任務移動 |
| 依賴（跨專案） | 建立 ExternalTaskDependency |

### 4.3 專案建立

新專案自動包含：
- 名稱：用戶輸入
- 描述：用戶輸入（可選）
- 成員：不自動包含（可後續邀請）
- 欄位：使用預設欄位

### 4.4 權限處理

- 原專案成員不會自動成為新專案成員
- 任務轉移後，creatorId 保持不變
- 如果任務 assignee 不是新專案成員，assigneeId 設為 null

### 4.5 跨專案依賴

```
原專案 A:
  任務 X ──依賴──> 任務 Y（也在 A 中）

轉換：X, Y 都轉到新專案 B
結果：X, Y 都在 B 中，正常依賴

原專案 A:
  任務 X ──依賴──> 任務 Z（不在選擇範圍內）

轉換：只有 X 轉到新專案 B
結果：Z 留在 A，建立 ExternalTaskDependency
```

## 5. UI/UX 設計

### 5.1 右鍵選單 / 多選操作
選擇多個任務後，浮出按鈕或右鍵選單：「轉為專案」

### 5.2 轉換對話框

```
┌─────────────────────────────────────────────────────────┐
│ 將任務轉為專案                                        [X] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 已選擇 5 個任務：                                        │
│ ☑ 任務 A (含 2 個子任務)                                │
│ ☑ 任務 B (含 0 個子任務)                                │
│ ☑ 任務 C (含 1 個子任務)                                │
│ ☑ 任務 D (含 0 個子任務)                                │
│ ☑ 任務 E (含 0 個子任務)                                │
│                                                         │
│ 共 8 個任務（含子任務）將被轉移到新專案                   │
│                                                         │
│ ─────────────────────────────────────────────────────── │
│                                                         │
│ 📁 新專案名稱                                            │
│ ┌─────────────────────────────────────────────────────┐│
│ │ 輸入新專案名稱...                                    ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ 📝 專案描述（可選）                                      │
│ ┌─────────────────────────────────────────────────────┐│
│ │                                                     ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ ─────────────────────────────────────────────────────── │
│                                                         │
│ ⚠️ 注意：                                               │
│ • 任務將從原專案移到新專案                              │
│ • 子任務將隨父任務一起轉移                              │
│ • 原專案的成員不會自動加入新專案                        │
│ • 跨專案依賴將被標記為外部依賴                          │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                              [取消]  [建立專案並轉移]      │
└─────────────────────────────────────────────────────────┘
```

### 5.3 轉換成功後
- 顯示成功提示，包含新專案連結
- 可選擇「跳轉到新專案」或「留在原專案」

## 6. API 實作要點

### 6.1 收集要轉移的任務
```typescript
async function collectTasksToMove(taskIds: string[]) {
  const tasksToMove: Set<string> = new Set();
  
  for (const taskId of taskIds) {
    tasksToMove.add(taskId);
    // 遞迴收集子任務
    await collectSubtasks(taskId, tasksToMove);
  }
  
  return Array.from(tasksToMove);
}

async function collectSubtasks(parentId: string, set: Set<string>) {
  const subtasks = await prisma.task.findMany({
    where: { parentTaskId: parentId }
  });
  for (const subtask of subtasks) {
    set.add(subtask.id);
    await collectSubtasks(subtask.id, set);
  }
}
```

### 6.2 轉換端點
```typescript
// POST /api/projects/from-tasks

// 1. 收集所有要轉移的任務（含子任務）
// 2. 建立新專案
// 3. 轉移任務到新專案
// 4. 處理依賴關係
// 5. 刪除原任務（若需要）
```

### 6.3 Transaction 範例
```typescript
await prisma.$transaction(async (tx) => {
  // 1. 建立新專案
  const project = await tx.project.create({
    data: {
      name: data.projectName,
      description: data.projectDescription,
      ownerId: userId
    }
  });
  
  // 2. 建立預設欄位
  const defaultColumns = ["待整理", "準備開始", "進行中", "待審核", "已完成"];
  for (let i = 0; i < defaultColumns.length; i++) {
    await tx.column.create({
      data: {
        name: defaultColumns[i],
        orderIndex: i,
        projectId: project.id
      }
    });
  }
  
  // 3. 轉移任務
  const taskIdMap = new Map<string, string>(); // oldId -> newId
  
  for (const taskId of allTaskIds) {
    const task = await tx.task.findUnique({ where: { id: taskId } });
    
    const newTask = await tx.task.create({
      data: {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        orderIndex: task.orderIndex,
        dueDate: task.dueDate,
        projectId: project.id,  // 關鍵：新專案
        assigneeId: task.assigneeId,
        createdById: task.createdById,
        parentTaskId: taskIdMap.get(task.parentTaskId) || null  // 更新 parent
      }
    });
    
    taskIdMap.set(taskId, newTask.id);
    
    // 轉移留言
    await tx.taskComment.updateMany({
      where: { taskId },
      data: { taskId: newTask.id }
    });
  }
  
  // 4. 處理依賴
  for (const taskId of allTaskIds) {
    const deps = await tx.taskDependency.findMany({
      where: { taskId }
    });
    
    for (const dep of deps) {
      if (allTaskIds.includes(dep.dependsOnId)) {
        // 同時轉移，更新 ID
        await tx.taskDependency.update({
          where: { id: dep.id },
          data: { 
            taskId: taskIdMap.get(taskId)!,
            dependsOnId: taskIdMap.get(dep.dependsOnId)!
          }
        });
      } else {
        // 跨專案依賴
        await tx.externalTaskDependency.create({
          data: {
            localTaskId: taskIdMap.get(taskId)!,
            localProjectId: project.id,
            externalTaskId: dep.dependsOnId,
            externalProjectId: (await tx.task.findUnique({ 
              where: { id: dep.dependsOnId }
            }))!.projectId
          }
        });
        // 刪除原依賴
        await tx.taskDependency.delete({ where: { id: dep.id } });
      }
    }
  }
  
  // 5. 刪除原任務（只刪除選中的，級聯刪除子任務）
  await tx.task.deleteMany({ 
    where: { id: { in: data.taskIds } }  // 只刪除選中的，不刪除子任務（已轉移）
  });
  
  // 實際上需要更複雜的邏輯... 
  // 更好的方式：更新 projectId 而不是刪除重建
});
```

### 6.4 更簡潔的實作方式
```typescript
// 實際上，直接更新 projectId 更高效
await prisma.$transaction(async (tx) => {
  // 1. 建立新專案
  const project = await tx.project.create({ ... });
  
  // 2. 直接更新任務的 projectId
  await tx.task.updateMany({
    where: { id: { in: allTaskIds } },
    data: { projectId: project.id }
  });
  
  // 3. 處理跨專案依賴
  // ...
});
```

## 7. 前端元件

| 元件 | 用途 |
|------|------|
| `ConvertToProjectDialog` | 轉為專案對話框 |
| `TaskSelectionSummary` | 顯示選擇的任務摘要 |
| `ProjectForm` | 新專案表單 |
| `ConvertSuccessDialog` | 轉換成功對話框（帶跳轉連結） |

## 8. 測試案例

| 案例 | 預期行為 |
|------|----------|
| 選擇 1 個任務轉為專案 | 建立新專案，1 個任務移入 |
| 選擇 5 個任務（部分有子任務） | 所有子任務一起轉移 |
| 轉移有同專案依賴的任務 | 依賴關係保留 |
| 轉移有跨專案依賴的任務 | 建立 ExternalTaskDependency |
| 輸入空專案名稱 | 返回驗證錯誤 |
| 選擇 0 個任務 | 返回驗證錯誤 |
