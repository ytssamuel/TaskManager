import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

import authRoutes from "@/routes/auth.routes";
import projectRoutes from "@/routes/project.routes";
import taskRoutes from "@/routes/task.routes";
import taskAssigneeRoutes from "@/routes/task-assignee.routes";
import taskCommentRoutes from "@/routes/task-comment.routes";
import columnRoutes from "@/routes/column.routes";
import testRoutes from "@/routes/test.routes";
import apiKeyRoutes from "@/routes/api-key.routes";
import activityRoutes from "@/routes/activity.routes";
import inviteRoutes from "@/routes/invite.routes";
import apiTaskRoutes from "@/routes/api-task.routes";
import { errorHandler } from "@/middlewares/error.middleware";
import { notFoundHandler } from "@/middlewares/not-found.middleware";

const app = express();
const PORT = process.env.PORT || 3000;

const isDev = process.env.NODE_ENV !== "production";

// CORS: 支援多個來源，從環境變數讀取
const getCorsOrigins = (): string | string[] => {
  const envOrigin = process.env.CORS_ORIGIN;
  
  // 如果有明確設定 CORS_ORIGIN，直接使用
  if (envOrigin) {
    // 支援特殊關鍵字：
    // - "*:vercel.app" = 允許所有 vercel.app 網域
    // - "*:onrender.com" = 允許所有 onrender.com 網域
    if (envOrigin.includes("*:")) {
      return envOrigin.split(",").map((origin) => origin.trim());
    }
    return envOrigin.split(",").map((origin) => origin.trim());
  }
  
  // 預設值
  if (isDev) {
    return ["http://localhost:5173", "http://localhost:3000"];
  }
  
  // 生產環境預設：允許所有 Vercel 和 Render 網域
  return [
    "https://taskmanager-dev.onrender.com",
    "https://*.vercel.app",
    "https://*.onrender.com",
  ];
};

// CORS 中間件配置
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // 允許沒有 origin 的請求（如 server-to-server）
    if (!origin) {
      return callback(null, true);
    }
    
    const allowedOrigins = getCorsOrigins();
    const originStr = Array.isArray(allowedOrigins) ? allowedOrigins.join(",") : allowedOrigins;
    
    // 檢查 origin 是否在允許列表中
    const isAllowed = (Array.isArray(allowedOrigins) ? allowedOrigins : [allowedOrigins]).some((allowed) => {
      // 支援 wildcard (*.vercel.app, *.onrender.com)
      if (allowed.includes("*")) {
        const regex = new RegExp("^" + allowed.replace(/\*/g, ".*") + "$");
        return regex.test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      console.log(`Allowed origins: ${originStr}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(helmet({
  contentSecurityPolicy: isDev ? undefined : undefined,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors(corsOptions));

// Rate Limit: 標準化設定
const rateLimitMax = Number(process.env.RATE_LIMIT_MAX) || (isDev ? 1000 : 5000);

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: rateLimitMax,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Too many requests, please try again later" } },
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads"), {
  setHeaders: (res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  },
}));

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "待辦事項管理系統 API",
    version: "1.0.0",
    documentation: "/api/test",
    health: "/api/test/health",
  });
});

// API Routes - 統一管理
// 注意：更具體的路徑應該在前面定義
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
// Test routes 需要在 apiTaskRoutes 之前
app.use("/api/test", testRoutes);
// API Key 路由
app.use("/api", apiTaskRoutes);  // API key 認證的 endpoints
// Task 相關路由
app.use("/api/tasks", taskRoutes);       // CRUD, status, order, dependencies
app.use("/api/tasks", taskAssigneeRoutes); // assignees
app.use("/api/tasks", taskCommentRoutes);  // comments
app.use("/api/columns", columnRoutes);
app.use("/api/keys", apiKeyRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/invites", inviteRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 伺服器運行中：http://localhost:${PORT}`);
  console.log(`📦 環境：${process.env.NODE_ENV || "development"}`);
  console.log(`📖 API 文件：http://localhost:${PORT}/api/test`);
});

export default app;
