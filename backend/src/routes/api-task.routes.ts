import { Router, Response, NextFunction } from "express";
import prisma from "@/utils/prisma";
import { successResponse, errorResponse } from "@/utils/response";
import { AuthRequest, apiKeyAuthMiddleware, getApiKeyPermissions } from "@/middlewares/api-key-auth.middleware";
import { checkApiKeyPermission } from "@/middlewares/api-key-permission.middleware";

const router = Router();

// 所有路由都需要 API Key 認證
router.use(apiKeyAuthMiddleware);

// 權限檢查 Helper
const requirePermission = (action: "read" | "create" | "edit" | "delete" | "manageProject") => {
  return (req: AuthRequest, res: Response, next: Function): void => {
    if (!req.user?.isApiKey) {
      next();
      return;
    }

    const permissions = getApiKeyPermissions(req.user.apiKeyRole);
    
    const actionMap = {
      read: "canRead",
      create: "canCreate",
      edit: "canEdit",
      delete: "canDelete",
      manageProject: "canManageProject",
    } as const;

    const requiredPermission = actionMap[action];

    if (!permissions[requiredPermission]) {
      res.status(403).json(
        errorResponse("PERMISSION_DENIED", `API Key 權限不足，無法執行 ${action} 操作`)
      );
      return;
    }

    // 如果 API Key 限定專案，檢查
    if (req.user.apiKeyProjectId) {
      const projectId = req.params.projectId || req.body.projectId;
      if (projectId && req.user.apiKeyProjectId !== projectId) {
        res.status(403).json(
          errorResponse("PERMISSION_DENIED", "此 API Key 只能訪問指定的專案")
        );
        return;
      }
    }

    next();
  };
};

// ============ ROUTES ============

// GET /api/summary - 取得任務摘要
router.get("/summary", requirePermission("read"), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const whereClause: any = {};

    // 如果 API Key 限定專案
    if (req.user.apiKeyProjectId) {
      whereClause.projectId = req.user.apiKeyProjectId;
    } else {
      whereClause.project = {
        members: {
          some: {
            userId: req.user.userId,
          },
        },
      };
    }

    const tasks = await prisma.task.findMany({ where: whereClause });

    const summary = {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === "DONE").length,
      inProgress: tasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "REVIEW").length,
      todo: tasks.filter((t) => t.status === "BACKLOG" || t.status === "READY").length,
    };

    res.json(successResponse(summary));
  } catch (error) {
    next(error);
  }
});

// GET /api/projects - 取得專案列表
router.get("/projects", requirePermission("read"), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const whereClause: any = {
      members: {
        some: {
          userId: req.user.userId,
        },
      },
    };

    // 如果 API Key 限定專案
    if (req.user.apiKeyProjectId) {
      whereClause.id = req.user.apiKeyProjectId;
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(successResponse(projects));
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id - 取得專案詳情
router.get("/projects/:id", requirePermission("read"), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { id } = req.params;

    // API Key 專案權限檢查
    if (req.user.isApiKey && req.user.apiKeyProjectId && req.user.apiKeyProjectId !== id) {
      res.status(403).json(errorResponse("PERMISSION_DENIED", "此 API Key 只能訪問指定的專案"));
      return;
    }

    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId: id,
        userId: req.user.userId,
      },
    });

    if (!membership) {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "無權限訪問此專案"));
      return;
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        columns: { orderBy: { orderIndex: "asc" } },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (!project) {
      res.status(404).json(errorResponse("NOT_FOUND", "專案不存在"));
      return;
    }

    res.json(successResponse(project));
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id/tasks - 取得專案任務列表
router.get("/projects/:id/tasks", requirePermission("read"), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { id } = req.params;

    // API Key 專案權限檢查
    if (req.user.isApiKey && req.user.apiKeyProjectId && req.user.apiKeyProjectId !== id) {
      res.status(403).json(errorResponse("PERMISSION_DENIED", "此 API Key 只能訪問指定的專案"));
      return;
    }

    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId: id,
        userId: req.user.userId,
      },
    });

    if (!membership) {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "無權限"));
      return;
    }

    const tasks = await prisma.task.findMany({
      where: { projectId: id },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: [{ status: "asc" }, { orderIndex: "asc" }],
    });

    res.json(successResponse(tasks));
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id/tasks/summary - 取得專案任務摘要
router.get("/projects/:id/tasks/summary", requirePermission("read"), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { id } = req.params;

    // API Key 專案權限檢查
    if (req.user.isApiKey && req.user.apiKeyProjectId && req.user.apiKeyProjectId !== id) {
      res.status(403).json(errorResponse("PERMISSION_DENIED", "此 API Key 只能訪問指定的專案"));
      return;
    }

    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId: id,
        userId: req.user.userId,
      },
    });

    if (!membership) {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "無權限"));
      return;
    }

    const tasks = await prisma.task.findMany({
      where: { projectId: id },
    });

    const summary = {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === "DONE").length,
      inProgress: tasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "REVIEW").length,
      todo: tasks.filter((t) => t.status === "BACKLOG" || t.status === "READY").length,
    };

    res.json(successResponse(summary));
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks - 建立任務
router.post("/tasks", requirePermission("create"), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { title, projectId, status, description, priority } = req.body;

    if (!title || !projectId) {
      res.status(400).json(errorResponse("VALIDATION_ERROR", "缺少必要參數"));
      return;
    }

    // API Key 專案權限檢查
    if (req.user.isApiKey && req.user.apiKeyProjectId && req.user.apiKeyProjectId !== projectId) {
      res.status(403).json(errorResponse("PERMISSION_DENIED", "此 API Key 只能訪問指定的專案"));
      return;
    }

    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: req.user.userId,
      },
    });

    if (!membership) {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "無權限"));
      return;
    }

    // 取得最後任務順序
    const lastTask = await prisma.task.findFirst({
      where: { projectId },
      orderBy: { orderIndex: "desc" },
    });

    const task = await prisma.task.create({
      data: {
        title,
        description: description || "",
        projectId,
        status: status || "BACKLOG",
        priority: priority || "MEDIUM",
        orderIndex: (lastTask?.orderIndex ?? -1) + 1,
        createdById: req.user.userId,
      },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(successResponse(task));
  } catch (error) {
    next(error);
  }
});

export default router;

// GET /api/tasks/search - 全文搜尋任務
router.get("/tasks/search", requirePermission("read"), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q, projectId, status, priority, assigneeId, limit = "20" } = req.query;

    if (!q || typeof q !== "string" || q.trim().length === 0) {
      res.status(400).json(errorResponse("VALIDATION_ERROR", "搜尋關鍵字不能為空"));
      return;
    }

    const searchQuery = q.trim();
    const limitNum = Math.min(parseInt(limit as string, 10) || 20, 100);

    // 構建 Prisma where 條件
    const whereConditions: any[] = [];

    // 文字搜尋：使用 ILIKE 進行簡單匹配（tsvector 需要額外migration）
    // 生產環境建議使用 PostgreSQL FTS（見 research/taskmanager-search-advanced-fts-2026-03-25.md）
    whereConditions.push({
      OR: [
        { title: { contains: searchQuery, mode: "insensitive" } },
        { description: { contains: searchQuery, mode: "insensitive" } },
      ],
    });

    // 專案過濾
    if (projectId && typeof projectId === "string") {
      whereConditions.push({ projectId });
    }

    // 狀態過濾
    if (status && typeof status === "string") {
      const statuses = status.split(",") as any[];
      whereConditions.push({ status: { in: statuses } });
    }

    // 優先度過濾
    if (priority && typeof priority === "string") {
      const priorities = priority.split(",") as any[];
      whereConditions.push({ priority: { in: priorities } });
    }

    // 負責人過濾
    if (assigneeId && typeof assigneeId === "string") {
      whereConditions.push({ assigneeId });
    }

    // API Key 專案權限檢查
    if (req.user?.isApiKey && req.user.apiKeyProjectId) {
      whereConditions.push({ projectId: req.user.apiKeyProjectId });
    }

    const tasks = await prisma.task.findMany({
      where: { AND: whereConditions },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: [
        // 標題精確匹配優先
        // 然後按 priority 等級（URGENT > HIGH > MEDIUM > LOW）
        { priority: "desc" },
        { updatedAt: "desc" },
      ],
      take: limitNum,
    });

    // 關鍵字高亮：簡單的前後標記
    const highlightText = (text: string | null, query: string): string => {
      if (!text) return "";
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return text.replace(new RegExp(`(${escaped})`, "gi"), "**$1**");
    };

    const results = tasks.map((task) => ({
      ...task,
      titleHighlight: highlightText(task.title, searchQuery),
      descriptionHighlight: task.description ? highlightText(task.description, searchQuery) : null,
    }));

    res.json(successResponse({
      query: searchQuery,
      count: results.length,
      results,
    }));
  } catch (error) {
    next(error);
  }
});
