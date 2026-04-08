import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { taskService } from "@/services/task";
import { getPriorityColor, getPriorityLabel } from "@/lib/utils";
import type { Subtask } from "@/lib/types";

interface SubtaskListProps {
  taskId: string;
  onSubtaskClick?: (subtask: Subtask) => void;
  onAddSubtask?: () => void;
}

export function SubtaskList({ taskId, onSubtaskClick, onAddSubtask }: SubtaskListProps) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (expanded) {
      loadSubtasks();
    }
  }, [expanded, taskId]);

  const loadSubtasks = async () => {
    setLoading(true);
    try {
      const data = await taskService.getSubtasks(taskId);
      setSubtasks(data.subtasks);
      setTotalCount(data.totalCount);
    } catch (error) {
      console.error("Failed to load subtasks:", error);
    } finally {
      setLoading(false);
    }
  };

  if (totalCount === 0 && !expanded) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" className="h-6 px-2" onClick={onAddSubtask}>
          <Plus className="h-3 w-3 mr-1" />
          新增子任務
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
          子任務 ({totalCount})
        </Button>
        <Button variant="ghost" size="sm" className="h-6 px-2" onClick={onAddSubtask}>
          <Plus className="h-3 w-3 mr-1" />
          新增
        </Button>
      </div>

      {expanded && (
        <div className="pl-4 space-y-2 border-l-2 border-muted">
          {loading ? (
            <p className="text-sm text-muted-foreground">載入中...</p>
          ) : subtasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">尚無子任務</p>
          ) : (
            subtasks.map((subtask) => (
              <div
                key={subtask.id}
                className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted cursor-pointer"
                onClick={() => onSubtaskClick?.(subtask)}
              >
                <span className="text-sm truncate flex-1">{subtask.title}</span>
                <Badge className={`text-xs ${getPriorityColor(subtask.priority)}`}>
                  {getPriorityLabel(subtask.priority)}
                </Badge>
                {subtask.childCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {subtask.childCount}
                  </Badge>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
