import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { apiKeyService, type ApiKey, type ApiKeyRole } from "@/services/apiKey";
import { projectService, type Project } from "@/services/project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Copy, Key, Check, Loader2, Shield, Folder } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const ROLE_OPTIONS: { value: ApiKeyRole; label: string; description: string }[] = [
  { value: "READ_ONLY", label: "唯讀", description: "只能讀取資料" },
  { value: "MEMBER", label: "成員", description: "讀取 + 建立任務" },
  { value: "ADMIN", label: "管理員", description: "讀取 + 建立 + 編輯" },
  { value: "OWNER", label: "擁有者", description: "完整權限" },
];

export function ApiKeys() {
  const { user } = useAuthStore();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // Form state
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyRole, setNewKeyRole] = useState<ApiKeyRole>("MEMBER");
  const [newKeyProjectId, setNewKeyProjectId] = useState<string>("");
  
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteKey, setDeleteKey] = useState<ApiKey | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [keysData, projectsData] = await Promise.all([
        apiKeyService.list(),
        projectService.getProjects(),
      ]);
      setKeys(keysData);
      setProjects(projectsData);
    } catch (error: any) {
      toast({ title: "載入失敗", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const createKey = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const key = await apiKeyService.create({
        name: newKeyName,
        role: newKeyRole,
        projectId: newKeyProjectId || null,
      });
      setKeys([key, ...keys]);
      setNewKeyName("");
      setNewKeyRole("MEMBER");
      setNewKeyProjectId("");
      toast({ title: "建立成功", description: `API Key: ${key.key}`, duration: 10000 });
    } catch (error: any) {
      toast({ title: "建立失敗", description: error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const deleteApiKey = async () => {
    if (!deleteKey) return;
    try {
      await apiKeyService.delete(deleteKey.id);
      setKeys(keys.filter(k => k.id !== deleteKey.id));
      setDeleteKey(null);
      toast({ title: "刪除成功", description: "API Key 已刪除" });
    } catch (error: any) {
      toast({ title: "刪除失敗", description: error.message, variant: "destructive" });
    }
  };

  const copyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "已複製", description: "API Key 已複製到剪貼簿" });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRoleBadge = (role: ApiKeyRole) => {
    const roleConfig = ROLE_OPTIONS.find(r => r.value === role);
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
        role === "OWNER" ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" :
        role === "ADMIN" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" :
        role === "MEMBER" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
        "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
      }`}>
        <Shield className="h-3 w-3" />
        {roleConfig?.label || role}
      </span>
    );
  };

  if (!user) return null;

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Key 管理
          </CardTitle>
          <CardDescription>
            建立和管理您的 API Key，用於程式化存取
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Create new key form */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="輸入 API Key 名稱"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createKey()}
                className="flex-1"
              />
              <Button onClick={createKey} disabled={creating || !newKeyName.trim()} className="w-full sm:w-auto">
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                建立 Key
              </Button>
            </div>
            
            {/* Role and Project Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="role-select" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  權限
                </Label>
                <Select value={newKeyRole} onValueChange={(v) => setNewKeyRole(v as ApiKeyRole)}>
                  <SelectTrigger id="role-select">
                    <SelectValue placeholder="選擇權限" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span>{option.label}</span>
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Project Selection (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="project-select" className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  限定專案 (可選)
                </Label>
                <Select value={newKeyProjectId} onValueChange={setNewKeyProjectId}>
                  <SelectTrigger id="project-select">
                    <SelectValue placeholder="所有專案" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">所有專案</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Keys list */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">載入中...</div>
          ) : keys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">尚無 API Keys</div>
          ) : (
            <div className="space-y-3">
              {keys.map((k) => (
                <div
                  key={k.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{k.name}</span>
                      {getRoleBadge(k.role)}
                    </div>
                    <div className="text-sm text-muted-foreground font-mono truncate">
                      {k.key}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-2">
                      <span>建立於 {formatDate(k.createdAt)}</span>
                      {k.projectId && (
                        <span className="flex items-center gap-1">
                          <Folder className="h-3 w-3" />
                          限定專案: {projects.find(p => p.id === k.projectId)?.name || `ID:${k.projectId}`}
                        </span>
                      )}
                      {k.lastUsedAt && <span>上次使用 {formatDate(k.lastUsedAt)}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyKey(k.key, k.id)}
                      className="w-full sm:w-auto"
                    >
                      {copiedId === k.id ? (
                        <Check className="h-4 w-4 mr-1" />
                      ) : (
                        <Copy className="h-4 w-4 mr-1" />
                      )}
                      <span className="hidden sm:inline">複製</span>
                    </Button>
                    <AlertDialog open={!!deleteKey} onOpenChange={() => setDeleteKey(null)}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteKey(k)}
                          className="w-full sm:w-auto"
                        >
                          <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                          <span className="hidden sm:inline">刪除</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>刪除 API Key</AlertDialogTitle>
                          <AlertDialogDescription>
                            確定要刪除 "{deleteKey?.name}" 嗎？此操作無法復原。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction onClick={deleteApiKey} className="bg-destructive text-destructive-foreground">
                            確認刪除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
