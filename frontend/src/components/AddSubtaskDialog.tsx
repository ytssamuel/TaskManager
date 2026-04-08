import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { taskService } from "@/services/task";
import { toast } from "@/hooks/use-toast";
import type { Task, Priority } from "@/lib/types";

interface AddSubtaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentTask: Task;
  onSubtaskCreated: (subtask: Task) => void;
}

interface SubtaskFormData {
  title: string;
  description: string;
  priority: Priority;
}

export function AddSubtaskDialog({ open, onOpenChange, parentTask, onSubtaskCreated }: AddSubtaskDialogProps) {
  if (!parentTask) {
    return null;
  }

  const [submitting, setSubmitting] = useState(false);

  const form = useForm<SubtaskFormData>({
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
    },
  });

  const handleSubmit = async (data: SubtaskFormData) => {
    setSubmitting(true);
    try {
      const subtask = await taskService.createSubtask(parentTask.id, {
        title: data.title,
        description: data.description || undefined,
        priority: data.priority,
      });
      toast({ title: "子任務已建立" });
      onSubtaskCreated(subtask);
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast({ title: "建立失敗", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
    { value: "LOW", label: "低" },
    { value: "MEDIUM", label: "中" },
    { value: "HIGH", label: "高" },
    { value: "URGENT", label: "緊急" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新增子任務</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">父任務</Label>
            <div className="p-2 rounded bg-muted/50 text-sm">{parentTask.title}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">任務標題</Label>
            <Input
              id="title"
              {...form.register("title", { required: "請輸入任務標題" })}
              placeholder="輸入子任務標題..."
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">描述（可選）</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="任務描述..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">優先級</Label>
            <Select
              value={form.watch("priority")}
              onValueChange={(v) => form.setValue("priority", v as Priority)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              取消
            </Button>
            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting ? "建立中..." : "建立"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
