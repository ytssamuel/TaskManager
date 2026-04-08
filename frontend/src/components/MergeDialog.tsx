import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { taskService } from "@/services/task";
import { toast } from "@/hooks/use-toast";
import type { Task, MergePreview, FieldConflict, Priority, TaskStatus } from "@/lib/types";

interface MergeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTasks: Task[];
  onMergeComplete: (mergedTask: Task) => void;
}

interface MergeFormData {
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string;
}

export function MergeDialog({ open, onOpenChange, selectedTasks, onMergeComplete }: MergeDialogProps) {
  const [preview, setPreview] = useState<MergePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<MergeFormData>({
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      status: "BACKLOG",
      dueDate: "",
    },
  });

  useEffect(() => {
    if (open && selectedTasks.length >= 2) {
      loadPreview();
    }
  }, [open, selectedTasks]);

  const loadPreview = async () => {
    setLoading(true);
    try {
      const data = await taskService.mergePreview(selectedTasks.map((t) => t.id));
      setPreview(data);

      form.reset({
        title: data.preview.title,
        description: data.preview.description || "",
        priority: data.preview.priority,
        status: data.preview.status,
        dueDate: data.preview.dueDate || "",
      });
    } catch (error: any) {
      toast({ title: "載入預覽失敗", description: error.message, variant: "destructive" });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: MergeFormData) => {
    setSubmitting(true);
    try {
      const result = await taskService.mergeTasks(
        selectedTasks.map((t) => t.id),
        {
          title: data.title,
          description: data.description || undefined,
          priority: data.priority,
          status: data.status,
          dueDate: data.dueDate || undefined,
          assigneeIds: preview?.preview.assignees.map((a) => a.id),
        }
      );
      toast({ title: "任務合併成功" });
      onMergeComplete(result.mergedTask);
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "合併失敗", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>合併任務</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">載入預覽中...</div>
        ) : preview ? (
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">已選擇 {selectedTasks.length} 個任務</Label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {selectedTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2 p-2 rounded bg-muted/50 text-sm">
                    <span className="truncate flex-1">{task.title}</span>
                    <span className="text-xs text-muted-foreground">優先級: {task.priority}</span>
                  </div>
                ))}
              </div>
            </div>

            {preview.conflicts.length > 0 && (
              <div className="space-y-3 border rounded-lg p-3">
                <Label className="text-sm font-medium">⚠️ 衝突欄位</Label>
                {preview.conflicts.map((conflict) => (
                  <ConflictField key={conflict.field} conflict={conflict} form={form} />
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">合併後標題</Label>
              <Input id="title" {...form.register("title", { required: true })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">合併後描述</Label>
              <Textarea id="description" {...form.register("description")} rows={4} />
            </div>

            {preview.preview.assignees.length > 0 && (
              <div className="space-y-2">
                <Label>負責人（將合併所有人）</Label>
                <div className="flex flex-wrap gap-1">
                  {preview.preview.assignees.map((assignee) => (
                    <span key={assignee.id} className="inline-flex items-center px-2 py-1 rounded-full bg-muted text-xs">
                      {assignee.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>⚠️ 子任務將隨來源任務刪除</span>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                取消
              </Button>
              <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                {submitting ? "合併中..." : "合併任務"}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ConflictField({ conflict, form }: { conflict: FieldConflict; form: any }) {
  if (conflict.field === "assignees") {
    return null;
  }

  return (
    <div className="space-y-1">
      <Label className="text-xs capitalize">{conflict.field}</Label>
      <RadioGroup
        value={form.watch(conflict.field as any)}
        onValueChange={(v: string) => form.setValue(conflict.field as any, v)}
        className="flex flex-wrap gap-2"
      >
        {conflict.values.map((v, i) => (
          <div key={v.taskId} className="flex items-center gap-1">
            <RadioGroupItem value={v.value} id={`${conflict.field}-${i}`} />
            <Label htmlFor={`${conflict.field}-${i}`} className="text-xs">
              {String(v.value)} {v.value === conflict.suggestedValue && "(建議)"}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
