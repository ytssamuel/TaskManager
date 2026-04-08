import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { taskService } from "@/services/task";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import type { Task } from "@/lib/types";

interface ConvertToProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTasks: Task[];
  onConvertComplete: () => void;
}

interface ConvertFormData {
  projectName: string;
  projectDescription: string;
}

export function ConvertToProjectDialog({
  open,
  onOpenChange,
  selectedTasks,
  onConvertComplete,
}: ConvertToProjectDialogProps) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ConvertFormData>({
    defaultValues: {
      projectName: "",
      projectDescription: "",
    },
  });

  const handleSubmit = async (data: ConvertFormData) => {
    setSubmitting(true);
    try {
      const result = await taskService.convertToProject({
        projectName: data.projectName,
        projectDescription: data.projectDescription || undefined,
        taskIds: selectedTasks.map((t) => t.id),
      });
      toast({ title: "已建立新專案", description: `「${result.project.name}」已建立` });
      onConvertComplete();
      onOpenChange(false);
      navigate(`/project/${result.project.id}`);
    } catch (error: any) {
      toast({ title: "轉換失敗", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const totalTaskCount = selectedTasks.reduce((acc, task) => acc + 1 + (task.childCount || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>將任務轉為專案</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">已選擇 {selectedTasks.length} 個任務</Label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {selectedTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-2 p-2 rounded bg-muted/50 text-sm">
                  <span className="truncate flex-1">{task.title}</span>
                  {task.childCount && task.childCount > 0 && (
                    <span className="text-xs text-muted-foreground">(含 {task.childCount} 個子任務)</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">共 {totalTaskCount} 個任務（含子任務）將被轉移</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectName">新專案名稱</Label>
            <Input
              id="projectName"
              {...form.register("projectName", { required: "請輸入專案名稱" })}
              placeholder="輸入新專案名稱..."
            />
            {form.formState.errors.projectName && (
              <p className="text-sm text-red-500">{form.formState.errors.projectName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectDescription">專案描述（可選）</Label>
            <Textarea
              id="projectDescription"
              {...form.register("projectDescription")}
              placeholder="輸入專案描述..."
              rows={3}
            />
          </div>

          <div className="border-t pt-4 space-y-2 text-sm text-muted-foreground">
            <p>⚠️ 注意：</p>
            <ul className="list-disc list-inside space-y-1">
              <li>任務將從原專案移到新專案</li>
              <li>子任務將隨父任務一起轉移</li>
              <li>原專案的成員不會自動加入新專案</li>
              <li>跨專案依賴將被標記為外部依賴</li>
            </ul>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              取消
            </Button>
            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting ? "處理中..." : "建立專案並轉移"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
