# 前端元件規劃

## 1. 元件架構總覽

```
src/components/
├── TaskTree/
│   ├── TaskTree.tsx           # 樹狀視圖容器
│   ├── TaskTreeNode.tsx       # 單一節點
│   └── SubtaskBadge.tsx      # 子任務數量 badge
├── TaskOperations/
│   ├── MergeDialog.tsx        # 合併對話框
│   ├── SplitDialog.tsx        # 拆分對話框
│   ├── ConvertToProjectDialog.tsx  # 轉為專案對話框
│   └── ConflictResolver.tsx   # 衝突解決元件
├── TaskSelection/
│   ├── TaskSelectionProvider.tsx  # 多選模式 Context
│   ├── TaskCheckbox.tsx       # 任務 checkbox
│   └── SelectionToolbar.tsx   # 多選模式工具列
└── Kanban/
    └── EnhancedTaskCard.tsx   # 增強的任務卡（支援階層顯示）
```

## 2. 新增類型定義

```typescript
// src/lib/types.ts 新增

export interface Subtask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  childCount: number;
}

export interface TaskWithSubtasks extends Task {
  subtasks?: Subtask[];
  childCount: number;
}

export interface MergePreview {
  conflicts: FieldConflict[];
  preview: Partial<Task>;
}

export interface FieldConflict {
  field: "title" | "description" | "priority" | "status" | "dueDate" | "assignees";
  values: { taskId: string; value: any }[];
  suggestedValue: any;
}

export interface SplitPreview {
  splits: {
    title: string;
    description: string;
    priority: Priority;
  }[];
}
```

## 3. TaskTree 元件

### 3.1 TaskTree.tsx
```tsx
interface TaskTreeProps {
  tasks: TaskWithSubtasks[];
  onTaskClick: (task: Task) => void;
  onAddSubtask: (parentId: string) => void;
  onMoveTask: (taskId: string, newParentId: string | null) => void;
}

function TaskTree({ tasks, onTaskClick, onAddSubtask, onMoveTask }: TaskTreeProps) {
  return (
    <div className="task-tree">
      {tasks.filter(t => !t.parentTaskId).map(task => (
        <TaskTreeNode 
          key={task.id} 
          task={task} 
          level={0}
          onTaskClick={onTaskClick}
          onAddSubtask={onAddSubtask}
          onMoveTask={onMoveTask}
        />
      ))}
    </div>
  );
}
```

### 3.2 TaskTreeNode.tsx
```tsx
interface TaskTreeNodeProps {
  task: TaskWithSubtasks;
  level: number;
  onTaskClick: (task: Task) => void;
  onAddSubtask: (parentId: string) => void;
  onMoveTask: (taskId: string, newParentId: string | null) => void;
}

function TaskTreeNode({ task, level, ... }: TaskTreeNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = task.childCount > 0 || (task.subtasks?.length ?? 0) > 0;
  
  return (
    <div className="task-tree-node" style={{ marginLeft: level * 24 }}>
      <div className="flex items-center gap-2">
        {hasChildren ? (
          <button onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronDown /> : <ChevronRight />}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <TaskCard task={task} onClick={() => onTaskClick(task)} />
      </div>
      {expanded && task.subtasks?.map(subtask => (
        <TaskTreeNode 
          key={subtask.id} 
          task={subtask} 
          level={level + 1}
          {...} 
        />
      ))}
    </div>
  );
}
```

## 4. MergeDialog 元件

### 4.1 MergeDialog.tsx
```tsx
interface MergeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTasks: Task[];
  onMerge: (mergedData: MergeData) => Promise<void>;
}

function MergeDialog({ selectedTasks, onMerge, ... }: MergeDialogProps) {
  const [preview, setPreview] = useState<MergePreview | null>(null);
  const [selectedValues, setSelectedValues] = useState<Record<string, any>>({});
  
  // 取得預覽
  useEffect(() => {
    if (open && selectedTasks.length >= 2) {
      fetchMergePreview(selectedTasks.map(t => t.id))
        .then(setPreview);
    }
  }, [open, selectedTasks]);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>合併任務</DialogTitle>
        </DialogHeader>
        
        {/* 任務列表 */}
        <SelectedTasksList tasks={selectedTasks} />
        
        {/* 衝突解決 */}
        {preview?.conflicts.map(conflict => (
          <ConflictResolver
            key={conflict.field}
            conflict={conflict}
            value={selectedValues[conflict.field]}
            onChange={(v) => setSelectedValues({ ...selectedValues, [conflict.field]: v })}
          />
        ))}
        
        {/* 合併後預覽 */}
        <MergePreviewForm
          preview={preview}
          values={selectedValues}
          onChange={setSelectedValues}
        />
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={() => onMerge({ 
            taskIds: selectedTasks.map(t => t.id),
            mergedData: selectedValues 
          })}>
            合併任務
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 4.2 ConflictResolver.tsx
```tsx
interface ConflictResolverProps {
  conflict: FieldConflict;
  value: any;
  onChange: (value: any) => void;
}

function ConflictResolver({ conflict, value, onChange }: ConflictResolverProps) {
  return (
    <div className="space-y-2">
      <Label>{conflict.field}</Label>
      <RadioGroup value={value} onValueChange={onChange}>
        {conflict.values.map((v, i) => (
          <div key={v.taskId} className="flex items-center gap-2">
            <RadioGroupItem value={v.value} id={`${conflict.field}-${i}`} />
            <Label htmlFor={`${conflict.field}-${i}`}>
              {formatValue(conflict.field, v.value)}
              {v.value === conflict.suggestedValue && " (建議)"}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
```

## 5. SplitDialog 元件

### 5.1 SplitDialog.tsx
```tsx
interface SplitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
  onSplit: (splits: SplitData[]) => Promise<void>;
}

function SplitDialog({ task, onSplit, ... }: SplitDialogProps) {
  const [splits, setSplits] = useState<SplitItem[]>([
    { title: `${task.title} (1/2)`, description: "", priority: task.priority },
    { title: `${task.title} (2/2)`, description: "", priority: task.priority }
  ]);
  
  const description = useWatch({ control: form.control, name: "description" });
  
  // 根據 --- 自動更新 splits
  useEffect(() => {
    const parts = description.split("---").filter(p => p.trim());
    if (parts.length >= 2) {
      setSplits(parts.map((part, i) => ({
        title: `${task.title} (${i + 1}/${parts.length})`,
        description: part.trim(),
        priority: task.priority
      })));
    }
  }, [description]);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* 描述編輯器 */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>使用 --- 分隔各任務內容</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="第一部分內容&#10;---&#10;第二部分內容" />
              </FormControl>
            </FormItem>
          )}
        />
        
        {/* 預覽 */}
        <SplitPreview splits={splits} onChange={setSplits} />
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={() => onSplit(splits)}>確認拆分</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## 6. TaskSelection 系統

### 6.1 TaskSelectionProvider.tsx
```tsx
interface TaskSelectionContextType {
  selectedTaskIds: Set<string>;
  isSelectionMode: boolean;
  toggleSelection: (taskId: string) => void;
  selectRange: (fromId: string, toId: string) => void;
  clearSelection: () => void;
  enterSelectionMode: () => void;
  exitSelectionMode: () => void;
}

const TaskSelectionContext = createContext<TaskSelectionContextType | null>(null);

export function TaskSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  // Shift + 點擊 範圍選擇
  const handleTaskClick = (taskId: string, event: MouseEvent) => {
    if (event.shiftKey && selectedTaskIds.size > 0) {
      selectRange(Array.from(selectedTaskIds)[0], taskId);
    } else {
      toggleSelection(taskId);
    }
  };
  
  return (
    <TaskSelectionContext.Provider value={{ ... }}>
      {children}
    </TaskSelectionContext.Provider>
  );
}
```

### 6.2 SelectionToolbar.tsx
```tsx
function SelectionToolbar() {
  const { selectedTaskIds, clearSelection, exitSelectionMode } = useTaskSelection();
  
  if (selectedTaskIds.size === 0) return null;
  
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-background border rounded-lg shadow-lg p-3 flex gap-3">
      <span className="text-sm">已選擇 {selectedTaskIds.size} 個任務</span>
      <Button size="sm" onClick={() => {/* 開啟合併 */}}>
        合併
      </Button>
      <Button size="sm" onClick={() => {/* 開啟轉專案 */}}>
        轉為專案
      </Button>
      <Button variant="ghost" size="sm" onClick={clearSelection}>
        取消
      </Button>
    </div>
  );
}
```

## 7. 服務層更新

```typescript
// src/services/task.ts 新增

export const taskService = {
  // ... existing methods
  
  // 父子任務
  getSubtasks(taskId: string): Promise<Subtask[]> { ... },
  createSubtask(parentId: string, data: TaskInput): Promise<Task> { ... },
  moveTask(taskId: string, parentId: string | null): Promise<void> { ... },
  
  // 合併
  getMergePreview(taskIds: string[]): Promise<MergePreview> { ... },
  mergeTasks(data: MergeData): Promise<Task> { ... },
  
  // 拆分
  splitTask(taskId: string, splits: SplitData[]): Promise<Task[]> { ... },
};

// src/services/project.ts 新增

export const projectService = {
  // ... existing methods
  
  createFromTasks(data: CreateFromTasksData): Promise<Project> { ... },
};
```

## 8. Store 更新

```typescript
// src/store/taskStore.ts

interface TaskStore {
  // ... existing state
  
  // 新增
  expandedTaskIds: Set<string>;
  toggleExpanded: (taskId: string) => void;
  selectedTaskIds: Set<string>;
  toggleSelected: (taskId: string) => void;
  isSelectionMode: boolean;
  enterSelectionMode: () => void;
  exitSelectionMode: () => void;
}
```

## 9. 快捷鍵

| 快捷鍵 | 功能 |
|--------|------|
| `Shift + 點擊` | 範圍選擇 |
| `Cmd/Ctrl + 點擊` | 多選切換 |
| `Escape` | 退出多選模式 |
| `M` | 合併選擇的任務（多選模式下） |
| `P` | 將選擇的任務轉為專案（多選模式下） |
