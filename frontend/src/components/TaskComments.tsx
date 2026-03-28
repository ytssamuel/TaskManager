import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Send, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/hooks/use-toast";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
}

interface TaskCommentsProps {
  taskId: string;
}

export function TaskComments({ taskId }: TaskCommentsProps) {
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");

  const loadComments = useCallback(async () => {
    // Check if user is authenticated first
    const token = localStorage.getItem("token");
    if (!token || !isAuthenticated) {
      console.log("Not authenticated, skipping comment load");
      setLoading(false);
      return;
    }

    try {
      const response = await api.get(`/tasks/${taskId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setComments(response.data.data || []);
      }
    } catch (error: any) {
      console.error("Failed to load comments:", error);
      // Don't redirect - just show empty comments on error
      if (error.response?.status === 401) {
        // Token might be expired, but don't redirect - just show empty
        console.log("Auth error loading comments");
      }
    } finally {
      setLoading(false);
    }
  }, [taskId, isAuthenticated]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const submitComment = async () => {
    if (!newComment.trim()) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    setSubmitting(true);
    try {
      const response = await api.post(`/tasks/${taskId}/comments`, 
        { content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setComments([...comments, response.data.data]);
        setNewComment("");
        toast({ title: "留言已發送" });
      }
    } catch (error: any) {
      toast({ title: "發送失敗", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!window.confirm("確定要刪除此留言嗎？")) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await api.delete(`/tasks/${taskId}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments(comments.filter(c => c.id !== commentId));
      toast({ title: "留言已刪除" });
    } catch (error: any) {
      toast({ title: "刪除失敗", description: error.message, variant: "destructive" });
    }
  };

  const getInitials = (name?: string) => name?.charAt(0).toUpperCase() || "?";

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleString("zh-TW", { 
      month: "short", 
      day: "numeric", 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  const canDelete = (comment: Comment) => {
    if (!currentUser) return false;
    // Check if user is the author
    if (comment.user.id === currentUser.id) return true;
    return false;
  };

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  return (
    <div className="space-y-4 pt-4">
      <h3 className="font-semibold">留言 ({comments.length})</h3>
      
      {/* Comments list */}
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">尚無留言</p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.user.avatarUrl || undefined} />
                <AvatarFallback className="text-xs">{getInitials(comment.user.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{comment.user.name}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                  {canDelete(comment) && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 ml-auto"
                      onClick={() => deleteComment(comment.id)}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </Button>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New comment form */}
      <div className="flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="新增留言..."
          className="min-h-[60px]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submitComment();
            }
          }}
        />
        <Button 
          onClick={submitComment} 
          disabled={submitting || !newComment.trim()}
          className="self-end"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
