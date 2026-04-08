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
import { Plus, Trash2 } from "lucide-react";
import type { Task, SplitItem, Priority } from "@/lib/types";

interface SplitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
  onSplitComplete: (newTasks: Task[]) => void;
}

interface SplitFormData {
  description: string;
}

export function SplitDialog({ open, onOpenChange, task, onSplitComplete }: SplitDialogProps) {
  const [splits, setSplits] = useState<SplitItem[]>([
    { title: `${task.title} (1/2)`, description: "", priority: task.priority },
    { title: `${task.title} (2/2)`, description: "", priority: task.priority },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<SplitFormData>({
    defaultValues: {
      description: task.description || "",
    },
  });

  const updateSplitFromDescription = (desc: string) => {
    const parts = desc.split("---").filter((p) => p.trim());
    if (parts.length >= 2) {
      setSplits(
        parts.map((part, i) => ({
          title: `${task.title} (${i + 1}/${parts.length})`,
          description: part.trim(),
          priority: task.priority,
        }))
      );
    }
  };

  const handleDescriptionChange = (value: string) => {
    form.setValue("description", value);
    updateSplitFromDescription(value);
  };

  const updateSplit = (index: number, field: keyof SplitItem, value: string) => {
    const newSplits = [...splits];
    newSplits[index] = { ...newSplits[index], [field]: value };
    setSplits(newSplits);
  };

  const addSplit = () => {
    setSplits([
      ...splits,
      { title: `${task.title} (${splits.length + 1}/${splits.length + 1})`, description: "", priority: task.priority },
    ]);
  };

  const removeSplit = (index: number) => {
    if (splits.length <= 2) return;
    setSplits(splits.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const validSplits = splits.filter((s) => s.title.trim() && s.description.trim());
    if (validSplits.length < 2) {
      toast({ title: "至少需要 2 個有效的拆分任務", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const result = await taskService.splitTask(task.id, validSplits);
      toast({ title: "任務拆分成功" });
      onSplitComplete(result.newTasks);
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "拆分失敗", description: error.message, variant: "destructive" });
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
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>拆分任務</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>原任務</Label>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="font-medium">{task.title}</p>
              {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">使用 --- 分隔各任務內容</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder={"第一部分內容\n---\n第二部分內容"}
              rows={6}
            />
            <p className="text-xs text-muted-foreground">使用 --- 分隔描述內容，系統會自動拆分為多個任務</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>預覽分割結果 ({splits.length} 個任務)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSplit}>
                <Plus className="h-3 w-3 mr-1" />
                新增一個任務
              </Button>
            </div>

            <div className="space-y-3">
              {splits.map((split, index) => (
                <div key={index} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">任務 {index + 1}</span>
                    {splits.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive"
                        onClick={() => removeSplit(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  <Input
                    placeholder="任務標題"
                    value={split.title}
                    onChange={(e) => updateSplit(index, "title", e.target.value)}
                  />

                  <Textarea
                    placeholder="任務描述"
                    value={split.description}
                    onChange={(e) => updateSplit(index, "description", e.target.value)}
                    rows={2}
                  />

                  <Select
                    value={split.priority}
                    onValueChange={(v) => updateSplit(index, "priority", v)}
                  >
                    <SelectTrigger className="h-8">
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
              ))}
            </div>
          </div>

          <div className="border-t pt-4 space-y-2 text-sm text-muted-foreground">
            <p>⚠️ 注意：</p>
            <ul className="list-disc list-inside space-y-1">
              <li>原任務的子任務將被刪除</li>
              <li>依賴關係將轉移到第一個新任務</li>
              <li>留言將移到第一個新任務</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full sm:w-auto">
            {submitting ? "拆分中..." : "確認拆分"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
