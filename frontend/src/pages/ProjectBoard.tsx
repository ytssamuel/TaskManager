import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTaskStore } from "@/store/taskStore";
import { useProjectStore } from "@/store/projectStore";
import { taskService } from "@/services/task";
import { projectService } from "@/services/project";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InviteModal } from "@/components/InviteModal";
import { TaskAssignees } from "@/components/TaskAssignees";
import { TaskComments } from "@/components/TaskComments";
import { getPriorityColor, getPriorityLabel, getStatusLabel } from "@/lib/utils";
import { taskSchema, type TaskInput } from "@/lib/validations";
import { ArrowLeft, Plus, Lock, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Trash2, Pencil, List, Layout } from "lucide-react";
import type { Task, Column } from "@/lib/types";

interface ColumnWithStatus extends Column {
  status: string;
}

const STATUS_OPTIONS = [
  { value: "BACKLOG", label: "待整理" },
  { value: "READY", label: "準備開始" },
  { value: "IN_PROGRESS", label: "進行中" },
  { value: "REVIEW", label: "待審核" },
  { value: "DONE", label: "已完成" },
];

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "低" },
  { value: "MEDIUM", label: "中" },
  { value: "HIGH", label: "高" },
  { value: "URGENT", label: "緊急" },
];

const getNextStatus = (currentStatus: string): string | null => {
  const currentIndex = STATUS_OPTIONS.findIndex((s) => s.value === currentStatus);
  if (currentIndex < STATUS_OPTIONS.length - 1) {
    return STATUS_OPTIONS[currentIndex + 1].value;
  }
  return null;
};

const getPrevStatus = (currentStatus: string): string | null => {
  const currentIndex = STATUS_OPTIONS.findIndex((s) => s.value === currentStatus);
  if (currentIndex > 0) {
    return STATUS_OPTIONS[currentIndex - 1].value;
  }
  return null;
};

export function ProjectBoard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tasks, setTasks, columns, setColumns, addTask, updateTask, removeTask } = useTaskStore();
  const { currentProject, setCurrentProject } = useProjectStore();
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [expandedColumns, setExpandedColumns] = useState<string[]>(["BACKLOG", "IN_PROGRESS"]);
  const [editViewMode, setEditViewMode] = useState<"stacked" | "tabs">("stacked");

  const createForm = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: { status: "BACKLOG", priority: "MEDIUM" },
  });

  // Project edit form
  const [projectEditOpen, setProjectEditOpen] = useState(false);
  const projectEditForm = useForm<{ name: string; description: string }>({
    defaultValues: { name: "", description: "" },
  });

  const editForm = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
  });

  useEffect(() => {
    if (id) loadData();
    return () => {
      setCurrentProject(null);
      setTasks([]);
      setColumns([]);
    };
  }, [id]);

  const loadData = async () => {
    try {
      const [project, taskData] = await Promise.all([
        projectService.getProject(id!),
        taskService.getProjectTasks(id!),
      ]);
      setCurrentProject(project);
      setColumns(taskData.columns);
      setTasks(taskData.tasks);
    } catch (error: any) {
      toast({ title: "載入失敗", description: error.message, variant: "destructive" });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const onCreateSubmit = async (data: TaskInput) => {
    if (!id) return;
    try {
      const newTask = await taskService.createTask({ ...data, projectId: id });
      addTask(newTask);
      toast({ title: "任務建立成功" });
      setCreateDialogOpen(false);
      createForm.reset({ status: "BACKLOG", priority: "MEDIUM" });
    } catch (error: any) {
      toast({ title: "建立失敗", description: error.message, variant: "destructive" });
    }
  };

  const onEditSubmit = async (data: TaskInput) => {
    if (!selectedTask) return;
    try {
      const updated = await taskService.updateTask(selectedTask.id, data);
      updateTask(selectedTask.id, updated);
      toast({ title: "任務更新成功" });
      setEditDialogOpen(false);
      setSelectedTask(null);
    } catch (error: any) {
      toast({ title: "更新失敗", description: error.message, variant: "destructive" });
    }
  };

  const openProjectEdit = () => {
    if (currentProject) {
      projectEditForm.reset({
        name: currentProject.name,
        description: currentProject.description || "",
      });
      setProjectEditOpen(true);
    }
  };

  const onProjectEditSubmit = async (data: { name: string; description: string }) => {
    if (!currentProject) return;
    try {
      const updated = await projectService.updateProject(currentProject.id, data);
      setCurrentProject(updated);
      toast({ title: "專案更新成功" });
      setProjectEditOpen(false);
    } catch (error: any) {
      toast({ title: "更新失敗", description: error.message, variant: "destructive" });
    }
  };

  const handleMoveTask = async (task: Task, direction: "next" | "prev") => {
    const newStatus = direction === "next" ? getNextStatus(task.status) : getPrevStatus(task.status);
    if (!newStatus) {
      toast({ title: "無法移動", description: direction === "next" ? "任務已完成最後狀態" : "任務已在最初狀態" });
      return;
    }

    try {
      const updated = await taskService.updateStatus(task.id, newStatus);
      updateTask(task.id, updated);
      toast({ title: "任務已移動", description: `移動至：${getStatusLabel(newStatus)}` });
    } catch (error: any) {
      toast({ title: "移動失敗", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("確定要刪除此任務嗎？")) return;
    try {
      await taskService.deleteTask(taskId);
      removeTask(taskId);
      toast({ title: "任務已刪除" });
      setEditDialogOpen(false);
      setSelectedTask(null);
    } catch (error: any) {
      toast({ title: "刪除失敗", description: error.message, variant: "destructive" });
    }
  };

  const openEditDialog = (task: Task) => {
    setSelectedTask(task);
    editForm.reset({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
    });
    setEditDialogOpen(true);
  };

  const getTasksByStatus = (status: string) => {
    const priorityOrder: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return tasks
      .filter((t) => t.status === status)
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  };

  const getColumnInfo = (columnName: string): ColumnWithStatus | undefined => {
    return columns.find((c) => c.name === columnName) as ColumnWithStatus | undefined;
  };

  const toggleColumn = (status: string) => {
    setExpandedColumns((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  if (loading) return <div className="h-[calc(100vh-100px)] flex items-center justify-center">載入中...</div>;

  // 任務卡片元件
  const TaskCard = ({ task, isMobile = false }: { task: Task; isMobile?: boolean }) => {
    const canMoveNext = getNextStatus(task.status) !== null;
    const canMovePrev = getPrevStatus(task.status) !== null;

    // 手機版：上下箭頭（上 = 往前一個狀態，下 = 往後一個狀態）
    // 桌面版：左右箭頭
    const PrevIcon = isMobile ? ChevronUp : ChevronLeft;
    const NextIcon = isMobile ? ChevronDown : ChevronRight;

    return (
      <div
        className="bg-card p-3 rounded-lg shadow-sm cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
        onClick={() => openEditDialog(task)}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-sm line-clamp-2">{task.title}</p>
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{task.description}</p>
        )}
        <div className="flex items-center justify-between mt-2 gap-2">
          <div className="flex items-center gap-2">
            <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>{getPriorityLabel(task.priority)}</Badge>
            {/* 顯示任務負責人 */}
            {currentProject?.members && (
              <TaskAssignees
                taskId={task.id}
                projectMembers={currentProject.members.map(m => ({ ...m.user, avatarUrl: m.user.avatarUrl || null }))}
                assignees={[]}
                onChange={() => {}}
              />
            )}
          </div>
          <div className={`flex items-center gap-0.5 ${isMobile ? "flex-col" : "flex-row"}`}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              disabled={!canMovePrev}
              onClick={(e) => {
                e.stopPropagation();
                handleMoveTask(task, "prev");
              }}
              title="移到上一階段"
            >
              <PrevIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              disabled={!canMoveNext}
              onClick={(e) => {
                e.stopPropagation();
                handleMoveTask(task, "next");
              }}
              title="移到下一階段"
            >
              <NextIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.14)-theme(spacing.16))] md:h-[calc(100vh-100px)]">
      {/* 頂部標題列 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0 pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold truncate">{currentProject?.name}</h1>
              <Button variant="ghost" size="icon" onClick={openProjectEdit} className="h-8 w-8">
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-muted-foreground text-sm truncate">{currentProject?.description || "無描述"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {id && <InviteModal projectId={id} />}
          <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            新建任務
          </Button>
        </div>
      </div>

      {/* 建立任務對話框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={createForm.handleSubmit(onCreateSubmit)}>
            <DialogHeader>
              <DialogTitle>建立新任務</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>任務標題</Label>
                <Input {...createForm.register("title")} placeholder="輸入任務標題" />
                {createForm.formState.errors.title && (
                  <p className="text-sm text-red-500">{createForm.formState.errors.title.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>描述（可選）</Label>
                <Textarea {...createForm.register("description")} placeholder="任務描述..." />
              </div>
              <div className="space-y-2">
                <Label>優先級</Label>
                <Select
                  value={createForm.watch("priority")}
                  onValueChange={(v) => createForm.setValue("priority", v as any)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)} className="w-full sm:w-auto">取消</Button>
              <Button type="submit" disabled={createForm.formState.isSubmitting} className="w-full sm:w-auto">
                {createForm.formState.isSubmitting ? "建立中..." : "建立"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 編輯任務對話框 */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) setSelectedTask(null);
      }}>
        <DialogContent 
          className={editViewMode === "tabs" 
            ? "!fixed !inset-0 !left-0 !top-0 !translate-x-0 !translate-y-0 !w-full !h-full !max-w-none !rounded-none !p-0 overflow-hidden" 
            : "sm:max-w-md max-h-[85vh] overflow-y-auto"
          }
        >
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="flex flex-col h-full">
            
            {/* 疊加模式 (手機/小框) - 維持原樣 */}
            {editViewMode === "stacked" && (
              <>
                <DialogHeader>
                  <DialogTitle>編輯任務</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>任務標題</Label>
                    <Input {...editForm.register("title")} />
                    {editForm.formState.errors.title && (
                      <p className="text-sm text-red-500">{editForm.formState.errors.title.message}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>狀態</Label>
                      <Select
                        value={editForm.watch("status")}
                        onValueChange={(v) => editForm.setValue("status", v as any)}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>優先級</Label>
                      <Select
                        value={editForm.watch("priority")}
                        onValueChange={(v) => editForm.setValue("priority", v as any)}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PRIORITY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* View Mode Toggle */}
                {selectedTask && (
                  <div className="border-t pt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant={editViewMode === "stacked" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setEditViewMode("stacked")}
                        className="h-8"
                      >
                        <Layout className="h-4 w-4 mr-1" />
                        疊加
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditViewMode("tabs")}
                        className="h-8"
                      >
                        <List className="h-4 w-4 mr-1" />
                        分頁
                      </Button>
                    </div>
                  </div>
                )}

                {/* 內容區域 */}
                {selectedTask && (
                  <div className="mt-4 mb-6 flex-1 overflow-y-auto">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>描述</Label>
                        <Textarea 
                          {...editForm.register("description")} 
                          placeholder="任務描述..." 
                          className="min-h-[100px]" 
                        />
                      </div>
                      <div className="border-t pt-4">
                        <TaskComments taskId={selectedTask.id} />
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter className="flex-col sm:flex-row sm:justify-end gap-2 shrink-0">
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setEditDialogOpen(false)} 
                      className="w-full sm:w-auto"
                    >
                      取消
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={editForm.formState.isSubmitting} 
                      className="w-full sm:w-auto"
                    >
                      {editForm.formState.isSubmitting ? "儲存中..." : "儲存"}
                    </Button>
                  </div>
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={() => selectedTask && handleDeleteTask(selectedTask.id)} 
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    刪除
                  </Button>
                </DialogFooter>
              </>
            )}

            {/* 分頁模式 (桌面版全螢幕) - 左右分割佈局 */}
            {editViewMode === "tabs" && selectedTask && (
              <div className="flex flex-1 min-h-0">
                
                {/* 左側: 任務資訊 (固定寬度) */}
                <div className="w-80 border-r p-4 flex flex-col shrink-0">
                  <DialogTitle className="text-lg font-bold mb-4">編輯任務</DialogTitle>
                  
                  <div className="space-y-4 flex-1">
                    {/* 標題 */}
                    <div className="space-y-2">
                      <Label>任務標題</Label>
                      <Input {...editForm.register("title")} />
                      {editForm.formState.errors.title && (
                        <p className="text-sm text-red-500">{editForm.formState.errors.title.message}</p>
                      )}
                    </div>
                    
                    {/* 狀態 + 優先級 */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label>狀態</Label>
                        <Select
                          value={editForm.watch("status")}
                          onValueChange={(v) => editForm.setValue("status", v as any)}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>優先級</Label>
                        <Select
                          value={editForm.watch("priority")}
                          onValueChange={(v) => editForm.setValue("priority", v as any)}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {PRIORITY_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* 視圖切換 */}
                    <div className="border-t pt-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditViewMode("stacked")}
                      >
                        <Layout className="h-4 w-4 mr-1" />
                        疊加
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setEditViewMode("tabs")}
                      >
                        <List className="h-4 w-4 mr-1" />
                        分頁
                      </Button>
                    </div>
                  </div>
                  
                  {/* 左側底部按鈕 */}
                  <div className="border-t pt-4 mt-4 flex flex-col gap-2">
                    <Button 
                      type="submit" 
                      disabled={editForm.formState.isSubmitting} 
                      className="w-full"
                    >
                      {editForm.formState.isSubmitting ? "儲存中..." : "儲存"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setEditDialogOpen(false)} 
                      className="w-full"
                    >
                      取消
                    </Button>
                    <Button 
                      type="button" 
                      variant="destructive" 
                      onClick={() => handleDeleteTask(selectedTask.id)} 
                      className="w-full"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      刪除
                    </Button>
                  </div>
                </div>
                
                {/* 右側: 描述/留言內容 (彈性寬度) */}
                <div className="flex-1 flex flex-col min-w-0">
                  <Tabs defaultValue="description" className="flex-1 flex flex-col h-full">
                    <TabsList className="grid w-full grid-cols-2 shrink-0 border-b rounded-none">
                      <TabsTrigger value="description">描述</TabsTrigger>
                      <TabsTrigger value="comments">留言</TabsTrigger>
                    </TabsList>
                    <TabsContent value="description" className="flex-1 overflow-y-auto p-4">
                      <Textarea 
                        {...editForm.register("description")} 
                        placeholder="任務描述..." 
                        className="min-h-[400px] h-full resize-none" 
                      />
                    </TabsContent>
                    <TabsContent value="comments" className="flex-1 overflow-y-auto p-4">
                      <TaskComments taskId={selectedTask.id} />
                    </TabsContent>
                  </Tabs>
                </div>
                
              </div>
            )}
            
          </form>
        </DialogContent>
      </Dialog>

      {/* 專案編輯對話框 */}
      <Dialog open={projectEditOpen} onOpenChange={setProjectEditOpen}>
        <DialogContent>
          <form onSubmit={projectEditForm.handleSubmit(onProjectEditSubmit)}>
            <DialogHeader>
              <DialogTitle>編輯專案</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>專案名稱</Label>
                <Input {...projectEditForm.register("name")} placeholder="輸入專案名稱" />
              </div>
              <div className="space-y-2">
                <Label>描述</Label>
                <Textarea {...projectEditForm.register("description")} placeholder="輸入專案描述" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setProjectEditOpen(false)}>取消</Button>
              <Button type="submit">儲存</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 桌面版：水平看板 */}
      <div className="hidden md:flex flex-1 gap-4 overflow-x-auto pb-4 min-h-0 scrollbar-thin">
        {STATUS_OPTIONS.map((statusOpt) => {
          const column = getColumnInfo(statusOpt.label);
          const tasksInColumn = getTasksByStatus(statusOpt.value);
          const isLocked = column?.isLocked;

          return (
            <div key={statusOpt.value} className="flex-shrink-0 w-72 lg:w-80 flex flex-col h-full">
              <div className={`bg-muted/50 rounded-lg p-3 flex-1 flex flex-col min-h-0 ${isLocked ? "border-l-4 border-orange-500" : ""}`}>
                <div className="flex items-center justify-between mb-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{statusOpt.label}</h3>
                    {isLocked && <Lock className="h-3 w-3 text-orange-500" />}
                  </div>
                  <Badge variant="secondary" className="text-xs">{tasksInColumn.length}</Badge>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 min-h-0 scrollbar-thin p-0.5 -m-0.5">
                  {tasksInColumn.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 手機版：垂直堆疊可展開 */}
      <div className="md:hidden flex-1 overflow-y-auto space-y-3 scrollbar-thin">
        {STATUS_OPTIONS.map((statusOpt) => {
          const column = getColumnInfo(statusOpt.label);
          const tasksInColumn = getTasksByStatus(statusOpt.value);
          const isLocked = column?.isLocked;
          const isExpanded = expandedColumns.includes(statusOpt.value);

          return (
            <Collapsible
              key={statusOpt.value}
              open={isExpanded}
              onOpenChange={() => toggleColumn(statusOpt.value)}
            >
              <div className={`bg-muted/50 rounded-lg ${isLocked ? "border-l-4 border-orange-500" : ""}`}>
                <CollapsibleTrigger asChild>
                  <button className="w-full p-3 flex items-center justify-between text-left">
                    <div className="flex items-center gap-2">
                      <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "" : "-rotate-90"}`} />
                      <h3 className="font-semibold text-sm">{statusOpt.label}</h3>
                      {isLocked && <Lock className="h-3 w-3 text-orange-500" />}
                    </div>
                    <Badge variant="secondary" className="text-xs">{tasksInColumn.length}</Badge>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-3 pb-3 space-y-2">
                    {tasksInColumn.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">沒有任務</p>
                    ) : (
                      tasksInColumn.map((task) => (
                        <TaskCard key={task.id} task={task} isMobile />
                      ))
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
