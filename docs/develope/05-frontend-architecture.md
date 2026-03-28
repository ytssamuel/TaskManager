# 前端架构

## 项目结构

```
frontend/src/
├── components/
│   ├── layout/
│   │   └── Layout.tsx           # 主布局组件
│   ├── providers/
│   │   └── ThemeProvider.tsx    # 主题提供者
│   ├── ui/                      # shadcn/ui 基础组件
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── select.tsx
│   │   ├── tabs.tsx
│   │   ├── card.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── label.tsx
│   │   ├── toast.tsx
│   │   ├── toaster.tsx
│   │   ├── textarea.tsx
│   │   ├── alert-dialog.tsx
│   │   └── collapsible.tsx
│   ├── TaskAssignees.tsx       # 任务指派组件
│   ├── TaskComments.tsx        # 任务评论组件
│   ├── TaskSummary.tsx         # 任务摘要组件
│   ├── InviteModal.tsx         # 邀请成员弹窗
│   ├── ThemeToggle.tsx         # 主题切换组件
│   └── *.tsx                   # 其他共享组件
├── pages/
│   ├── Login.tsx               # 登录页
│   ├── Register.tsx            # 注册页
│   ├── Dashboard.tsx           # 仪表盘
│   ├── ProjectList.tsx         # 项目列表页
│   ├── ProjectBoard.tsx        # 项目看板页
│   ├── Profile.tsx             # 个人设置页
│   ├── ApiTest.tsx             # API 测试页
│   ├── Invite.tsx              # 邀请页
│   ├── ApiKeys.tsx             # API Keys 管理页
│   └── Help.tsx                # 帮助页
├── hooks/
│   ├── use-toast.ts            # Toast hook
│   └── use-fetch.ts            # Fetch hook
├── lib/
│   ├── api.ts                  # Axios 实例配置
│   ├── utils.ts                # 工具函数
│   ├── validations.ts          # Zod 验证规则
│   └── types.ts                # TypeScript 类型定义
├── services/
│   ├── auth.ts                 # 认证服务
│   ├── project.ts              # 项目服务
│   ├── task.ts                 # 任务服务
│   └── apiKey.ts               # API Key 服务
├── store/
│   ├── authStore.ts            # 认证状态 (Zustand)
│   ├── projectStore.ts         # 项目状态
│   ├── taskStore.ts            # 任务状态
│   └── themeStore.ts           # 主题状态
├── __tests__/
│   ├── App.test.tsx            # 组件测试
│   └── setup.ts                # 测试配置
├── App.tsx                     # 主应用组件
├── main.tsx                    # 入口文件
└── index.css                   # 全局样式
```

## 技术细节

### 状态管理 (Zustand)

```typescript
// authStore.ts
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  login: (credentials: LoginParams) => Promise<void>;
  register: (data: RegisterParams) => Promise<void>;
  logout: () => void;
  updateProfile: (data: UpdateProfileParams) => Promise<void>;
}
```

### 路由配置

```typescript
// App.tsx
const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    element: <ProtectedLayout />,
    children: [
      {
        path: '/',
        element: <Dashboard />,
      },
      {
        path: '/projects',
        element: <ProjectList />,
      },
      {
        path: '/projects/:id',
        element: <ProjectBoard />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
```

### API 服务

```typescript
// lib/api.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

// 请求拦截器 - 自动添加 token
api.interceptors.request.use((config) => {
  const token = authStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 处理认证错误
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      authStore.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 样式设计

- 使用 **Tailwind CSS** 实现 Vercel 风格的深色/浅色主题
- 主要颜色方案：
  - 背景: `bg-white` / `bg-gray-900`
  - 文字: `text-gray-900` / `text-gray-100`
  - 主色: `blue-600` / `blue-500`
  - 边框: `gray-200` / `gray-700`

## 页面组件

### 登录/注册页面

- 表单验证（Zod）
- 记住登录状态
- 错误提示

### 仪表盘

- 显示所有项目概览
- 快速创建任务入口
- 最近活动

### 项目列表

- 卡片式项目展示
- 创建/删除项目
- 搜索筛选

### 项目看板

- 看板视图（Kanban Board）
- 拖拽排序
- 任务详情弹窗
- 任务依赖可视化
- 列锁定状态显示

### 个人设置

- 查看个人资讯
- 修改用户名
- 上传/更换头像
- 修改密码
- 删除帐号功能
