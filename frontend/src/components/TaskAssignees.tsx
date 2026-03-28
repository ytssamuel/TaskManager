import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";
import type { ApiResponse } from "@/lib/types";
import { UserPlus, X } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface TaskAssigneesProps {
  taskId: string;
  projectMembers: User[];
  assignees: User[];
  onChange?: (assignees: User[]) => void;
}

export function TaskAssignees({ taskId, projectMembers, assignees, onChange }: TaskAssigneesProps) {
  const [open, setOpen] = useState(false);

  const addAssignee = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.post<ApiResponse<User[]>>(
        `/tasks/${taskId}/assignees`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        onChange?.(response.data.data || []);
        toast({ title: "已新增負責人" });
      }
    } catch (error: any) {
      toast({ title: "新增失敗", description: error.message, variant: "destructive" });
    }
  };

  const removeAssignee = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      await api.delete<ApiResponse<{ message: string }>>(
        `/tasks/${taskId}/assignees/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onChange?.(assignees.filter(a => a.id !== userId));
      toast({ title: "已移除負責人" });
    } catch (error: any) {
      toast({ title: "移除失敗", description: error.message, variant: "destructive" });
    }
  };

  const assignedIds = assignees.map(a => a.id);
  const availableMembers = projectMembers.filter(m => !assignedIds.includes(m.id));

  const getInitials = (name: string) => {
    return name?.charAt(0).toUpperCase() || "?";
  };

  return (
    <div className="flex items-center gap-1">
      {/* Current assignees */}
      <div className="flex -space-x-2">
        {assignees.map((assignee) => (
          <Avatar key={assignee.id} className="h-7 w-7 border-2 border-background">
            <AvatarImage src={assignee.avatarUrl || undefined} />
            <AvatarFallback className="text-xs">{getInitials(assignee.name)}</AvatarFallback>
          </Avatar>
        ))}
      </div>

      {/* Add assignee button */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <UserPlus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>選擇負責人</DialogTitle>
            <DialogDescription>
              指派任務負責人
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {availableMembers.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">無可選成員</div>
            ) : (
              <div className="space-y-2">
                {availableMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => { addAssignee(member.id); setOpen(false); }}
                  >
                    <Avatar>
                      <AvatarImage src={member.avatarUrl || undefined} />
                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{member.name}</div>
                      <div className="text-sm text-muted-foreground truncate">{member.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {assignees.length > 0 && (
              <div className="pt-4 border-t">
                <div className="text-sm font-medium mb-2">移除負責人</div>
                <div className="space-y-2">
                  {assignees.map((assignee) => (
                    <div
                      key={assignee.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => removeAssignee(assignee.id)}
                    >
                      <Avatar>
                        <AvatarImage src={assignee.avatarUrl || undefined} />
                        <AvatarFallback>{getInitials(assignee.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{assignee.name}</div>
                      </div>
                      <X className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>關閉</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
