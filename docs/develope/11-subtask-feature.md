# 父子任務功能

## 1. 功能概述

父子任務功能允許任務形成樹狀階層結構，支援：
- 任務下可建立多個子任務
- 子任務可以有自己的子任務（孫任務）
- 支援無限層級嵌套（建議最多 3 層）

## 2. 使用情境

| 情境 | 說明 |
|------|------|
| Epic → Story → Task | 大任務拆解為中型任務，再拆解為具體執行項 |
| 專案子目標 | 一個大目標拆成多個子目標各自追蹤 |
| 工作分解 | 複雜任務拆解為可管理的小任務 |

## 3. 商業規則

### 3.1 建立規則
- 建立子任務時，預設繼承父任務的 `projectId`
- 子任務的 `status` 預設為 `BACKLOG`
- 子任務的 `priority` 可獨立設定

### 3.2 刪除規則
- 刪除父任務時，所有子任務會級聯刪除
- 刪除前需確認，並顯示將被刪除的子任務數量

### 3.3 狀態規則
- 子任務狀態變化不影響父任務
- 可選：設定「父任務需等所有子任務完成才能完成」（未來功能）

### 3.4 依賴規則
- 父子任務之間不可建立依賴關係
- 同父任務的子任務之間可以建立依賴

### 3.5 移動規則
- 可將任務移動到另一個父任務下
- 可將任務設為根任務（`parentTaskId: null`）
- 不可形成循環引用（A→B→C→A）

## 4. UI/UX 設計

### 4.1 任務卡顯示
```
┌─────────────────────────┐
│ 📁 父任務標題             │
│    ├─ 📄 子任務 1         │
│    ├─ 📄 子任務 2         │
│    └─ 📄 子任務 3 (+2)   │  ← 超過3個顯示數量
└─────────────────────────┘
```

### 4.2 Kanban 看板顯示
- 預設只顯示根任務（第一層）
- 點擊展開箭頭顯示子任務
- 子任務縮排顯示

### 4.3 右鍵選單
```
┌────────────────┐
│ 📝 編輯         │
│ 📋 複製連結     │
├────────────────┤
│ ➕ 新增子任務   │  ← 新增
│ 📂 移動到...    │
├────────────────┤
│ 🔗 建立依賴    │
│ 📦 合併        │
│ ✂️ 拆分         │
├────────────────┤
│ 🗑️ 刪除        │
└────────────────┘
```

## 5. API 實作要點

### 5.1 建立子任務
```typescript
// POST /api/tasks/:id/subtasks
// 自動設定 parentTaskId 為 :id
const subtask = await prisma.task.create({
  data: {
    ...data,
    parentTaskId: parentId,
    projectId: parentTask.projectId,  // 自動繼承
    createdById: userId
  }
});
```

### 5.2 取得階層任務
```typescript
// 遞迴查詢（限制深度）
const tasks = await prisma.task.findMany({
  where: { 
    projectId,
    parentTaskId: null  // 只取根任務
  },
  include: {
    subtasks: {
      include: {
        subtasks: true  // 孫任務
      }
    }
  }
});
```

### 5.3 移動任務（防止循環）
```typescript
// PUT /api/tasks/:id/parent
async function moveTask(taskId: string, newParentId: string | null) {
  // 檢查是否會形成循環
  if (newParentId) {
    const wouldCreateCycle = await checkCyclicDependency(taskId, newParentId);
    if (wouldCreateCycle) {
      throw new Error("CIRCULAR_DEPENDENCY");
    }
  }
  
  await prisma.task.update({
    where: { id: taskId },
    data: { parentTaskId: newParentId }
  });
}

async function checkCyclicDependency(taskId: string, newParentId: string): Promise<boolean> {
  let currentId: string | null = newParentId;
  const visited = new Set<string>();
  
  while (currentId) {
    if (currentId === taskId) return true;
    if (visited.has(currentId)) return false;
    visited.add(currentId);
    
    const task = await prisma.task.findUnique({
      where: { id: currentId },
      select: { parentTaskId: true }
    });
    currentId = task?.parentTaskId ?? null;
  }
  return false;
}
```

## 6. 前端元件

| 元件 | 用途 |
|------|------|
| `SubtaskBadge` | 顯示子任務數量 |
| `SubtaskList` | 可折叠的子任務列表 |
| `SubtaskTree` | 完整的階層樹狀視圖 |
| `AddSubtaskDialog` | 新增子任務對話框 |
| `MoveTaskDialog` | 移動任務到其他父任務 |

## 7. 測試案例

| 案例 | 預期行為 |
|------|----------|
| 建立子任務 | 子任務的 projectId 自動與父任務相同 |
| 刪除父任務 | 所有子任務被級聯刪除 |
| 移動任務形成循環 | 返回錯誤，不執行移動 |
| 查詢只顯示根任務 | 使用 `parentTaskId: null` 過濾 |
| 展開顯示子任務 | 前端遞迴渲染 subtasks |
