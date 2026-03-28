// Permission helper
const isAdmin = (role?: string) => role === "ADMIN" || role === "OWNER";

import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import prisma from "@/utils/prisma";
import { successResponse, errorResponse } from "@/utils/response";
import { AuthRequest } from "@/middlewares/auth.middleware";

const createTaskSchema = z.object({
  projectId: z.string().uuid("無效的專案 ID"),
  title: z.string().min(1, "任務標題不能為空").max(200, "任務標題最多 200 個字元"),
  description: z.string().optional(),
  status: z.enum(["BACKLOG", "READY", "IN_PROGRESS", "REVIEW", "DONE"]).default("BACKLOG"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  assigneeId: z.string().uuid().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(["BACKLOG", "READY", "IN_PROGRESS", "REVIEW", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().datetime().optional().nullable(),
});

const updateTaskStatusSchema = z.object({
  status: z.enum(["BACKLOG", "READY", "IN_PROGRESS", "REVIEW", "DONE"]),
  columnId: z.string().uuid().optional(),
});

const reorderSchema = z.object({
  orderIndex: z.number().int().min(0),
  columnId: z.string().uuid(),
});

const addDependencySchema = z.object({
  dependsOnId: z.string().uuid("無效的任務 ID"),
});

async function checkTaskLock(taskId: string): Promise<{ locked: boolean; reason?: string }> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        include: {
          columns: true,
        },
      },
      dependencies: {
        where: {
          dependsOn: {
            status: { not: "DONE" },
          },
        },
        include: {
          dependsOn: true,
        },
      },
    },
  });

  if (!task) {
    return { locked: true, reason: "任務不存在" };
  }

  const column = task.project.columns.find((c) => c.orderIndex === task.orderIndex);

  if (column?.isLocked) {
    const previousTasks = await prisma.task.findMany({
      where: {
        projectId: task.projectId,
        orderIndex: { lt: task.orderIndex },
        status: { not: "DONE" },
      },
      orderBy: { orderIndex: "desc" },
    });

    if (previousTasks.length > 0) {
      const lockedBy = previousTasks[0];
      return {
        locked: true,
        reason: `必須先完成「${lockedBy.title}」`,
      };
    }
  }

  if (task.dependencies.length > 0) {
    const dependency = task.dependencies[0];
    return {
      locked: true,
      reason: `必須先完成依賴任務「${dependency.dependsOn.title}」`,
    };
  }

  return { locked: false };
}

export const getProjectTasks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { projectId } = req.params;

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

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        dependencies: {
          include: {
            dependsOn: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: [{ orderIndex: "asc" }],
    });

    const columns = await prisma.column.findMany({
      where: { projectId },
      orderBy: { orderIndex: "asc" },
    });

    res.json(successResponse({ tasks, columns }));
  } catch (error) {
    next(error);
  }
};

export const getTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        dependencies: {
          include: {
            dependsOn: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
        dependentOn: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!task) {
      res.status(404).json(errorResponse("NOT_FOUND", "任務不存在"));
      return;
    }

    res.json(successResponse(task));
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const data = createTaskSchema.parse(req.body);

    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId: data.projectId,
        userId: req.user.userId,
      },
    });

    if (!membership) {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "無權限在該專案新增任務"));
      return;
    }

    // MEMBER can only create tasks in BACKLOG
    if (!isAdmin(req.user.role) && membership.role === "MEMBER" && data.status !== "BACKLOG") {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "成員只能新增任務至「待整理」"));
      return;
    }

    const lastTask = await prisma.task.findFirst({
      where: {
        projectId: data.projectId,
        status: data.status,
      },
      orderBy: { orderIndex: "desc" },
    });

    const orderIndex = (lastTask?.orderIndex ?? -1) + 1;

    const task = await prisma.task.create({
      data: {
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        assigneeId: data.assigneeId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        orderIndex,
        createdById: req.user.userId,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json(successResponse(task));
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { id } = req.params;
    const data = updateTaskSchema.parse(req.body);

    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!task) {
      res.status(404).json(errorResponse("NOT_FOUND", "任務不存在"));
      return;
    }

    // Check if user is admin in this project
    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId: task.projectId,
        userId: req.user.userId,
      },
    });

    if (!membership) {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "無權限"));
      return;
    }

    // MEMBER cannot edit tasks
    if (!isAdmin(req.user.role) && membership.role === "MEMBER") {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "成員無法編輯任務"));
      return;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json(successResponse(updatedTask));
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      res.status(404).json(errorResponse("NOT_FOUND", "任務不存在"));
      return;
    }

    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId: task.projectId,
        userId: req.user.userId,
      },
    });

    if (!membership) {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "無權限"));
      return;
    }

    // MEMBER cannot delete tasks
    if (!isAdmin(req.user.role) && membership.role === "MEMBER") {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "成員無法刪除任務"));
      return;
    }

    await prisma.task.delete({ where: { id } });

    res.json(successResponse({ message: "任務已刪除" }));
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { id } = req.params;
    const data = updateTaskStatusSchema.parse(req.body);

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: { columns: true },
        },
        dependencies: {
          where: {
            dependsOn: { status: { not: "DONE" } },
          },
          include: { dependsOn: true },
        },
      },
    });

    if (!task) {
      res.status(404).json(errorResponse("NOT_FOUND", "任務不存在"));
      return;
    }

    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId: task.projectId,
        userId: req.user.userId,
      },
    });

    if (!membership) {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "無權限"));
      return;
    }

    // MEMBER permission checks for status changes
    if (!isAdmin(req.user.role) && membership.role === "MEMBER") {
      // Cannot move to READY (from BACKLOG)
      if (task.status === "BACKLOG" && data.status === "READY") {
        res.status(403).json(errorResponse("PERMISSION_ERROR", "成員無法將任務移至「準備開始」"));
        return;
      }
      // Cannot move to DONE (only ADMIN can complete)
      if (data.status === "DONE") {
        res.status(403).json(errorResponse("PERMISSION_ERROR", "成員無法將任務標記為「已完成」"));
        return;
      }
    }

    if (task.status !== data.status) {
      const column = task.project.columns.find((c) => c.name === task.status);

      if (column?.isLocked) {
        const previousTasks = await prisma.task.findMany({
          where: {
            projectId: task.projectId,
            status: { not: "DONE", equals: task.status },
            orderIndex: { lt: task.orderIndex },
          },
          orderBy: { orderIndex: "desc" },
        });

        if (previousTasks.length > 0) {
          res.status(400).json(
            errorResponse("TASK_LOCKED", `必須先完成「${previousTasks[0].title}」`)
          );
          return;
        }
      }

      if (task.dependencies.length > 0) {
        const dep = task.dependencies[0];
        res.status(400).json(
          errorResponse("TASK_LOCKED", `必須先完成依賴任務「${dep.dependsOn.title}」`)
        );
        return;
      }

      const lastTaskInNewStatus = await prisma.task.findFirst({
        where: {
          projectId: task.projectId,
          status: data.status,
        },
        orderBy: { orderIndex: "desc" },
      });

      const newOrderIndex = (lastTaskInNewStatus?.orderIndex ?? -1) + 1;

      const updatedTask = await prisma.task.update({
        where: { id },
        data: { status: data.status, orderIndex: newOrderIndex },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      res.json(successResponse(updatedTask));
      return;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { status: data.status },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json(successResponse(updatedTask));
  } catch (error) {
    next(error);
  }
};

export const reorderTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { id } = req.params;
    const data = reorderSchema.parse(req.body);

    const task = await prisma.task.findUnique({ where: { id } });

    if (!task) {
      res.status(404).json(errorResponse("NOT_FOUND", "任務不存在"));
      return;
    }

    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId: task.projectId,
        userId: req.user.userId,
      },
    });

    if (!membership) {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "無權限"));
      return;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { orderIndex: data.orderIndex },
    });

    res.json(successResponse(updatedTask));
  } catch (error) {
    next(error);
  }
};

export const addDependency = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { id } = req.params;
    const data = addDependencySchema.parse(req.body);

    const task = await prisma.task.findUnique({ where: { id } });

    if (!task) {
      res.status(404).json(errorResponse("NOT_FOUND", "任務不存在"));
      return;
    }

    if (data.dependsOnId === id) {
      res.status(400).json(errorResponse("VALIDATION_ERROR", "任務不能依賴自己"));
      return;
    }

    const dependsOnTask = await prisma.task.findUnique({
      where: { id: data.dependsOnId },
    });

    if (!dependsOnTask) {
      res.status(404).json(errorResponse("NOT_FOUND", "依賴任務不存在"));
      return;
    }

    if (dependsOnTask.projectId !== task.projectId) {
      res.status(400).json(errorResponse("VALIDATION_ERROR", "只能在同一專案內建立依賴"));
      return;
    }

    const existingDep = await prisma.taskDependency.findUnique({
      where: {
        taskId_dependsOnId: {
          taskId: id,
          dependsOnId: data.dependsOnId,
        },
      },
    });

    if (existingDep) {
      res.status(409).json(errorResponse("CONFLICT", "該依賴已存在"));
      return;
    }

    const dependency = await prisma.taskDependency.create({
      data: {
        taskId: id,
        dependsOnId: data.dependsOnId,
      },
      include: {
        dependsOn: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    res.status(201).json(successResponse(dependency));
  } catch (error) {
    next(error);
  }
};

export const removeDependency = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { id, depId } = req.params;

    await prisma.taskDependency.delete({
      where: {
        taskId_dependsOnId: {
          taskId: id,
          dependsOnId: depId,
        },
      },
    });

    res.json(successResponse({ message: "依賴已移除" }));
  } catch (error) {
    next(error);
  }
};

// GET /tasks/search?q=keyword - 搜尋任務（網頁版）
export const searchTasks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { q, projectId, status, priority, assigneeId, limit = "50" } = req.query;

    if (!q || typeof q !== "string" || q.trim().length === 0) {
      res.status(400).json(errorResponse("VALIDATION_ERROR", "搜尋關鍵字不能為空"));
      return;
    }

    const searchQuery = q.trim();
    const limitNum = Math.min(parseInt(limit as string, 10) || 50, 200);

    // 構建 Prisma where 條件
    const whereConditions: any[] = [];

    // 文字搜尋
    whereConditions.push({
      OR: [
        { title: { contains: searchQuery, mode: "insensitive" } },
        { description: { contains: searchQuery, mode: "insensitive" } },
      ],
    });

    // 專案過濾
    if (projectId && typeof projectId === "string") {
      // 確認使用者有權限訪問該專案
      const membership = await prisma.projectMember.findFirst({
        where: { projectId, userId: req.user.userId },
      });
      if (!membership) {
        res.json(successResponse({ query: searchQuery, count: 0, results: [] }));
        return;
      }
      whereConditions.push({ projectId });
    } else {
      // 跨專案搜尋：只搜使用者有權限的專案
      const memberships = await prisma.projectMember.findMany({
        where: { userId: req.user.userId },
        select: { projectId: true },
      });
      const projectIds = memberships.map((m) => m.projectId);
      whereConditions.push({ projectId: { in: projectIds } });
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

    const tasks = await prisma.task.findMany({
      where: { AND: whereConditions },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: [
        { priority: "desc" },
        { updatedAt: "desc" },
      ],
      take: limitNum,
    });

    // 關鍵字高亮
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
};

export default {
  getProjectTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  reorderTask,
  addDependency,
  removeDependency,
  searchTasks,
};
