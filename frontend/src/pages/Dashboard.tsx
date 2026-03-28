import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { projectService } from "@/services/project";
import type { Project } from "@/services/project";
import { apiKeyService } from "@/services/apiKey";
import type { ApiKey, ApiKeyRole } from "@/services/apiKey";
import { TaskSummary } from "@/components/TaskSummary";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/hooks/use-toast";
import { projectSchema } from "@/lib/validations";
import { FolderKanban, Plus, Users, CheckCircle2, Trash2, Copy, Key, Check, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { z } from "zod";

type ProjectInput = z.infer<typeof projectSchema>;

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create project dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const createForm = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });
  
  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [creatingKey, setCreatingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyRole, setNewKeyRole] = useState<ApiKeyRole>("MEMBER");
  const [newKeyProjectId, setNewKeyProjectId] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteKey, setDeleteKey] = useState<ApiKey | null>(null);

  useEffect(() => {
    loadProjects();
    loadApiKeys();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (error) {
      console.error("載入專案失敗:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadApiKeys = async () => {
    try {
      const data = await apiKeyService.list();
      setApiKeys(data);
    } catch (error) {
      console.error("載入 API Keys 失敗:", error);
    } finally {
      setKeysLoading(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      await projectService.deleteProject(projectId);
      setProjects(projects.filter(p => p.id !== projectId));
      toast({ title: "專案已刪除" });
    } catch (error: any) {
      toast({ title: "刪除失敗", description: error.message, variant: "destructive" });
    }
  };

  const onCreateSubmit = async (data: ProjectInput) => {
    try {
      const newProject = await projectService.createProject(data);
      setProjects([...projects, newProject]);
      setCreateDialogOpen(false);
      createForm.reset();
      toast({ title: "專案已建立" });
      // Navigate to the project board
      navigate(`/projects/${newProject.id}`);
    } catch (error: any) {
      toast({ title: "建立失敗", description: error.message, variant: "destructive" });
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) return;
    setCreatingKey(true);
    try {
      const key = await apiKeyService.create({ 
        name: newKeyName,
        role: newKeyRole,
        projectId: newKeyProjectId || null,
      });
      setApiKeys([key, ...apiKeys]);
      setNewKeyName("");
      setNewKeyRole("MEMBER");
      setNewKeyProjectId("");
      // Store the key in localStorage for copying (temporary solution)
      const storedKeys = JSON.parse(localStorage.getItem("api_keys") || "{}");
      storedKeys[key.id] = key.key;
      localStorage.setItem("api_keys", JSON.stringify(storedKeys));
      toast({ title: "建立成功", description: `API Key: ${key.key}，請立即複製並妥善保存！` });
    } catch (error: any) {
      toast({ title: "建立失敗", description: error.message, variant: "destructive" });
    } finally {
      setCreatingKey(false);
    }
  };

  const getStoredKey = (keyId: string): string | null => {
    try {
      const storedKeys = JSON.parse(localStorage.getItem("api_keys") || "{}");
      return storedKeys[keyId] || null;
    } catch {
      return null;
    }
  };

  const copyKey = (keyId: string, _masked: string) => {
    const storedKey = getStoredKey(keyId);
    if (storedKey) {
      navigator.clipboard.writeText(storedKey);
      toast({ title: "已複製到剪貼簿" });
    } else {
      toast({ title: "請重新建立 API Key", description: "Key 只會顯示一次，請在建立時複製", variant: "destructive" });
    }
    setCopiedId(keyId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteApiKey = async () => {
    if (!deleteKey) return;
    try {
      await apiKeyService.delete(deleteKey.id);
      setApiKeys(apiKeys.filter(k => k.id !== deleteKey.id));
      setDeleteKey(null);
      toast({ title: "API Key 已刪除" });
    } catch (error: any) {
      toast({ title: "刪除失敗", description: error.message, variant: "destructive" });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("zh-TW", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-8">
      {/* 專案列表 */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">儀表板</h1>
            <p className="text-muted-foreground text-sm">歡迎回來！{user?.name}</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            新建專案
          </Button>
        </div>

        {/* 建立專案對話框 */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)}>
              <DialogHeader>
                <DialogTitle>建立新專案</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>專案名稱</Label>
                  <Input {...createForm.register("name")} placeholder="輸入專案名稱" />
                  {createForm.formState.errors.name && (
                    <p className="text-sm text-red-500">{createForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>描述（可選）</Label>
                  <Textarea {...createForm.register("description")} placeholder="輸入專案描述" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)} className="w-full sm:w-auto">取消</Button>
                <Button type="submit" disabled={createForm.formState.isSubmitting} className="w-full sm:w-auto">
                  {createForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  建立
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {loading ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader><div className="h-6 bg-muted rounded w-3/4"></div></CardHeader>
                <CardContent><div className="h-4 bg-muted rounded w-1/2"></div></CardContent>
              </Card>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center">
            <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">尚未有專案</h3>
            <p className="text-muted-foreground mb-4">建立您的第一個專案來開始管理任務</p>
            <Button onClick={() => setCreateDialogOpen(true)}>建立專案</Button>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} className="hover:bg-muted/50 transition-colors h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <Link to={`/projects/${project.id}`} className="flex-1">
                      <CardTitle className="line-clamp-1 text-lg">{project.name}</CardTitle>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>刪除專案</AlertDialogTitle>
                          <AlertDialogDescription>
                            確定要刪除「{project.name}」嗎？此操作無法復原。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteProject(project.id)} className="bg-destructive text-destructive-foreground">
                            確認刪除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <CardDescription className="line-clamp-2">{project.description || "無描述"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {project.membersCount}
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      {project.tasksCount?.done || 0}/{project.tasksCount?.total || 0}
                    </div>
                  </div>
                  <TaskSummary projectId={project.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* API Key 管理 */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Key 管理
            </CardTitle>
            <CardDescription>建立和管理 API Key，用於程式化存取</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 建立新 Key */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  placeholder="輸入 API Key 名稱"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createApiKey()}
                  className="flex-1 h-10 px-3 rounded-md border bg-background"
                />
                <Button onClick={createApiKey} disabled={creatingKey || !newKeyName.trim()} className="w-full sm:w-auto">
                  {creatingKey ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  建立
                </Button>
              </div>
              
              {/* 權限和專案選擇 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={newKeyRole}
                  onChange={(e) => setNewKeyRole(e.target.value as ApiKeyRole)}
                  className="h-10 px-3 rounded-md border bg-background"
                >
                  <option value="READ_ONLY">唯讀</option>
                  <option value="MEMBER">成員</option>
                  <option value="ADMIN">管理員</option>
                  <option value="OWNER">擁有者</option>
                </select>
                <select
                  value={newKeyProjectId}
                  onChange={(e) => setNewKeyProjectId(e.target.value)}
                  className="h-10 px-3 rounded-md border bg-background"
                >
                  <option value="">所有專案</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Keys 列表 */}
            {keysLoading ? (
              <div className="text-center py-4 text-muted-foreground">載入中...</div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">尚無 API Keys</div>
            ) : (
              <div className="space-y-2">
                {apiKeys.map((k) => (
                  <div key={k.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {k.name}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          k.role === "OWNER" ? "bg-purple-100 text-purple-700" :
                          k.role === "ADMIN" ? "bg-blue-100 text-blue-700" :
                          k.role === "MEMBER" ? "bg-green-100 text-green-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {k.role === "READ_ONLY" ? "唯讀" : 
                           k.role === "MEMBER" ? "成員" : 
                           k.role === "ADMIN" ? "管理員" : "擁有者"}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground font-mono truncate">tm_live_****</div>
                      <div className="text-xs text-muted-foreground">
                        建立於 {formatDate(k.createdAt)}
                        {k.projectId && <span className="ml-2">限定專案: {projects.find(p => p.id === k.projectId)?.name || `ID:${k.projectId}`}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => copyKey(k.id, k.key)}>
                        {copiedId === k.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>刪除 API Key</AlertDialogTitle>
                            <AlertDialogDescription>確定要刪除「{k.name}」嗎？</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={() => { setDeleteKey(k); deleteApiKey(); }} className="bg-destructive text-destructive-foreground">確認</AlertDialogAction>
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
      </section>
    </div>
  );
}
