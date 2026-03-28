import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/hooks/use-toast";

export function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyInvite = async () => {
      if (!token) {
        setError("無效的邀請連結");
        setLoading(false);
        return;
      }

      try {
        const tokenStr = localStorage.getItem("token");
        const response = await api.get(`/invites/${token}`, {
          headers: tokenStr ? { Authorization: `Bearer ${tokenStr}` } : {},
        });
        
        if (response.data.success) {
          setInviteData(response.data.data);
        } else {
          setError(response.data.error?.message || "無法驗證邀請");
        }
      } catch (err: any) {
        setError(err.response?.data?.error?.message || "無法驗證邀請");
      } finally {
        setLoading(false);
      }
    };

    verifyInvite();
  }, [token]);

  const acceptInvite = async () => {
    try {
      const tokenStr = localStorage.getItem("token");
      if (!tokenStr) {
        navigate("/login");
        return;
      }

      const response = await api.post(`/invites/${token}/accept`, {}, {
        headers: { Authorization: `Bearer ${tokenStr}` },
      });

      if (response.data.success) {
        toast({ title: "成功加入專案" });
        navigate("/");
      } else {
        toast({ title: "加入失敗", description: response.data.error?.message, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "加入失敗", description: err.response?.data?.error?.message || "錯誤", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">無法加入專案</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              返回首頁
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>邀請加入專案</CardTitle>
          <CardDescription>
            您被邀請加入專案「{inviteData?.project?.name}」
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            邀請者：{inviteData?.invitedBy?.name || inviteData?.invitedBy?.email}
          </div>
          <div className="text-sm text-muted-foreground">
            權限：{inviteData?.role === "ADMIN" ? "管理員" : "成員"}
          </div>
          <Button onClick={acceptInvite} className="w-full">
            接受邀請
          </Button>
          {!isAuthenticated && (
            <p className="text-sm text-center text-muted-foreground">
              登入後才能接受邀請
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
