import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { API_URL } from "@/lib/api";

export function Help() {
  const apiKey = "tm_live_91afe4674834a2ee";

  const downloadSkill = () => {
    const apiBase = API_URL;
    const skillContent = `# TaskManager API Skill

## 概述
TaskManager 是一個任務管理系統，提供 REST API 讓 AI 或外部程式自動化操作。

## 前置需求
- TaskManager 運行中（${apiBase}）
- 已建立 API Key

## API Key 格式
tm_live_xxxxxxxxxxxxxxxx

## API 端點

### 認證
Authorization: Bearer YOUR_API_KEY

### 專案 API
- GET /api/projects - 取得專案列表
- POST /api/projects - 建立專案
- GET /api/projects/:id - 取得專案詳情
- DELETE /api/projects/:id - 刪除專案

### 任務 API
- GET /api/projects/:id/tasks - 取得任務列表
- POST /api/tasks - 建立任務
- PUT /api/tasks/:id - 更新任務
- DELETE /api/tasks/:id - 刪除任務

### 任務統計
- GET /api/projects/:id/tasks/summary - 任務統計

### 邀請系統
- POST /api/invites - 建立邀請
- POST /api/invites/:token/accept - 接受邀請

### 任務指派
- POST /api/tasks/:id/assignees - 新增負責人
- DELETE /api/tasks/:id/assignees/:userId - 移除負責人

### 任務留言
- GET /api/tasks/:id/comments - 取得任務留言
- POST /api/tasks/:id/comments - 新增任務留言
- DELETE /api/tasks/:id/comments/:commentId - 刪除留言（作者或 ADMIN）

## 使用範例

### 取得專案
curl ${apiBase}/api/projects -H "Authorization: Bearer tm_live_xxx"

### 建立任務
curl -X POST ${apiBase}/api/tasks \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer tm_live_xxx" \\
  -d '{"title":"新任務","projectId":"ID","columnId":"ID"}'

### 任務統計
curl ${apiBase}/api/projects/{id}/tasks/summary \\
  -H "Authorization: Bearer tm_live_xxx"
`;
    const blob = new Blob([skillContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "taskmanager-api-skill.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">使用說明</h1>
          <p className="text-muted-foreground">TaskManager 完整功能指南</p>
        </div>
        <Button variant="outline" onClick={downloadSkill}>
          <Download className="h-4 w-4 mr-2" />
          下載 API Skill
        </Button>
      </div>

      {/* 功能總覽 */}
      <Card>
        <CardHeader>
          <CardTitle>功能總覽</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">📊 儀表板</h3>
            <p className="text-sm text-muted-foreground">
              顯示您所有專案的概覽，包括任務統計。您可以在此建立、刪除專案，以及管理 API Keys。
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">📋 專案看板</h3>
            <p className="text-sm text-muted-foreground">
              以看板形式管理任務，支援拖曳移動任務狀態。每個任務可以設定優先權、描述、以及指派多人負責。
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">👥 多人協作</h3>
            <p className="text-sm text-muted-foreground">
              透過邀請連結邀請成員加入專案，設定權限（管理員/成員），任務可指派給多人負責。
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">🔑 API Key</h3>
            <p className="text-sm text-muted-foreground">
              建立 API Key 讓外部程式或 AI 可以自動化管理任務。
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">💬 任務留言</h3>
            <p className="text-sm text-muted-foreground">
              可在任務下留言討論，追蹤任務進度與決策。API 也支援程式化新增/查詢留言。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 日常使用 */}
      <Card>
        <CardHeader>
          <CardTitle>日常使用</CardTitle>
          <CardDescription>快速上手指南</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>從儀表板點擊「新建專案」建立新專案</li>
            <li>進入專案看板，點擊「新建任務」新增任務</li>
            <li>點擊任務卡片可以編輯詳情、設定優先權</li>
            <li>點擊任務旁邊的 + 按鈕可指派多人負責</li>
            <li>點擊「邀請成員」產生邀請連結分享給隊友</li>
            <li>任務完成後點擊箭頭移動到下一階段</li>
          </ol>
        </CardContent>
      </Card>

      {/* API 對接 */}
      <Card>
        <CardHeader>
          <CardTitle>API 對接</CardTitle>
          <CardDescription>如何透過 API 管理任務</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">取得 API Key</h3>
            <p className="text-sm text-muted-foreground mb-2">
              在儀表板下方找到 API Key 管理區塊，建立一個新的 Key。
            </p>
            <div className="bg-muted p-3 rounded-lg font-mono text-sm break-all">
              {apiKey}
            </div>
            <p className="text-xs text-muted-foreground mt-1">（此為測試 Key）</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">API 呼叫方式</h3>
            <p className="text-sm text-muted-foreground mb-2">
              在 Authorization header 中傳入 Bearer Token：
            </p>
            <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
{`curl -X GET ${API_URL}/api/projects \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">主要 API 端點</h3>
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <Badge variant="outline">GET</Badge>
                <code className="text-muted-foreground">/api/projects</code>
                <span className="text-muted-foreground">- 取得專案列表</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">POST</Badge>
                <code className="text-muted-foreground">/api/projects</code>
                <span className="text-muted-foreground">- 建立專案</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">GET</Badge>
                <code className="text-muted-foreground">/api/projects/:id/tasks</code>
                <span className="text-muted-foreground">- 取得任務列表</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">POST</Badge>
                <code className="text-muted-foreground">/api/tasks</code>
                <span className="text-muted-foreground">- 建立任務</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">PUT</Badge>
                <code className="text-muted-foreground">/api/tasks/:id</code>
                <span className="text-muted-foreground">- 更新任務</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">GET</Badge>
                <code className="text-muted-foreground">/api/projects/:id/tasks/summary</code>
                <span className="text-muted-foreground">- 任務統計</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">GET</Badge>
                <code className="text-muted-foreground">/api/tasks/:id/comments</code>
                <span className="text-muted-foreground">- 取得任務留言</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">POST</Badge>
                <code className="text-muted-foreground">/api/tasks/:id/comments</code>
                <span className="text-muted-foreground">- 新增任務留言</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">使用範例</h3>
            <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
{`# 建立任務
curl -X POST ${API_URL}/api/tasks \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{"title":"新任務","projectId":"PROJECT_ID","columnId":"COLUMN_ID"}'

# 取得任務統計
curl ${API_URL}/api/projects/PROJECT_ID/tasks/summary \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* 多人協作 */}
      <Card>
        <CardHeader>
          <CardTitle>多人協作</CardTitle>
          <CardDescription>邀請隊友一起管理任務</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">邀請成員</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>進入專案看板</li>
              <li>點擊「邀請成員」按鈕</li>
              <li>輸入對方的 Email</li>
              <li>選擇權限（管理員或成員）</li>
              <li>點擊「建立邀請」</li>
              <li>複製邀請連結傳給對方</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-2">接受邀請</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>收到的邀請連結會類似：{API_URL?.replace('/api', '') || 'http://localhost:5173'}/invite/invite_xxx</li>
              <li>登入後訪問該連結</li>
              <li>點擊接受邀請即可加入專案</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-2">任務指派</h3>
            <p className="text-sm text-muted-foreground">
              點擊任務卡片旁邊的 + 按鈕，可以為任務新增/移除負責人。一個任務可以有多個負責人。
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">權限說明</h3>
            <div className="space-y-2 text-sm">
              <div><Badge>OWNER</Badge> <span className="text-muted-foreground ml-2">專案所有者，可管理所有設定</span></div>
              <div><Badge>ADMIN</Badge> <span className="text-muted-foreground ml-2">管理員，可管理任務和成員</span></div>
              <div><Badge>MEMBER</Badge> <span className="text-muted-foreground ml-2">成員，可管理任務</span></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 自動化 */}
      <Card>
        <CardHeader>
          <CardTitle>自動化</CardTitle>
          <CardDescription>AI 自動化任務管理</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">定時摘要</h3>
            <p className="text-sm text-muted-foreground">
              每天早上 9:00 會自動收到任務摘要，包含各專案的任務進度統計。
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">每週報告</h3>
            <p className="text-sm text-muted-foreground">
              每週一早上 9:00 會收到週報，總結本週完成任務和下週建議。
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">AI 協作</h3>
            <p className="text-sm text-muted-foreground">
              使用 API Key 可以讓 AI 幫你建立、更新、查詢任務。例如：
            </p>
            <pre className="bg-muted p-3 rounded-lg text-sm mt-2 overflow-x-auto">
{`# AI 可以幫你：
# - 建立新任務
# - 更新任務狀態
# - 查詢任務進度
# - 新增任務留言
# - 產生任務報告`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
