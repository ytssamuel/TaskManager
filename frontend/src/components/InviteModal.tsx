import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";
import type { ApiResponse } from "@/lib/types";
import { Copy, MailPlus, Check, Loader2 } from "lucide-react";

interface InviteModalProps {
  projectId: string;
  onInviteCreated?: () => void;
}

export function InviteModal({ projectId, onInviteCreated }: InviteModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"MEMBER" | "ADMIN">("MEMBER");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createInvite = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await api.post<ApiResponse<{ inviteLink: string }>>(
        "/invites",
        { projectId, email, role, expiresInDays: 7 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setInviteLink(response.data.data?.inviteLink || "");
        setEmail("");
        toast({ title: "邀請已建立", description: "複製連結分享給對方" });
        onInviteCreated?.();
      }
    } catch (error: any) {
      toast({ title: "建立失敗", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "已複製" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <MailPlus className="h-4 w-4 mr-2" />
          邀請成員
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{inviteLink ? "邀請已建立" : "邀請成員"}</DialogTitle>
          <DialogDescription>
            {inviteLink ? "複製連結分享給對方" : "邀請新成員加入此專案"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {!inviteLink && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">權限</Label>
                <Select value={role} onValueChange={(v) => setRole(v as "MEMBER" | "ADMIN")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">成員</SelectItem>
                    <SelectItem value="ADMIN">管理員</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          {inviteLink && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-2">邀請連結</div>
              <div className="flex gap-2">
                <Input
                  value={inviteLink}
                  readOnly
                  className="text-xs font-mono"
                />
                <Button size="sm" variant="outline" onClick={copyLink}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-between gap-2">
          <Button variant="ghost" onClick={() => { setOpen(false); setInviteLink(null); }}>
            {inviteLink ? "完成" : "取消"}
          </Button>
          {!inviteLink && (
            <Button onClick={createInvite} disabled={loading || !email.trim()}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              建立邀請
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
