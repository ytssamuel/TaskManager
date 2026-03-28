import { Router, Response, NextFunction } from "express";
import { z } from "zod";
import prisma from "@/utils/prisma";
import { successResponse, errorResponse } from "@/utils/response";
import { AuthRequest } from "@/middlewares/auth.middleware";

const router = Router();

const addAssigneeSchema = z.object({
  userId: z.string().uuid("無效的用戶 ID"),
});

export const addAssignee = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { id } = req.params;
    const data = addAssigneeSchema.parse(req.body);

    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
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

    const userToAssign = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!userToAssign) {
      res.status(404).json(errorResponse("NOT_FOUND", "用戶不存在"));
      return;
    }

    const userMembership = await prisma.projectMember.findFirst({
      where: {
        projectId: task.projectId,
        userId: data.userId,
      },
    });

    if (!userMembership) {
      res.status(400).json(errorResponse("VALIDATION_ERROR", "該用戶不是專案成員"));
      return;
    }

    const existingAssignee = await prisma.task.findFirst({
      where: {
        id,
        assignees: {
          some: {
            id: data.userId,
          },
        },
      },
    });

    if (existingAssignee) {
      res.status(409).json(errorResponse("CONFLICT", "該用戶已是任務負責人"));
      return;
    }

    const assignee = await prisma.task.update({
      where: { id },
      data: {
        assignees: {
          connect: { id: data.userId },
        },
      },
      include: {
        assignees: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.json(successResponse(assignee.assignees));
  } catch (error) {
    next(error);
  }
};

export const removeAssignee = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { id, userId } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
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

    const assignee = await prisma.task.findFirst({
      where: {
        id,
        assignees: {
          some: {
            id: userId,
          },
        },
      },
    });

    if (!assignee) {
      res.status(404).json(errorResponse("NOT_FOUND", "該用戶不是任務負責人"));
      return;
    }

    await prisma.task.update({
      where: { id },
      data: {
        assignees: {
          disconnect: { id: userId },
        },
      },
    });

    res.json(successResponse({ message: "已移除任務負責人" }));
  } catch (error) {
    next(error);
  }
};

export const getAssignees = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
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

    const assignees = await prisma.task.findUnique({
      where: { id },
      include: {
        assignees: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.json(successResponse(assignees?.assignees || []));
  } catch (error) {
    next(error);
  }
};

router.post("/:id/assignees", addAssignee);
router.get("/:id/assignees", getAssignees);
router.delete("/:id/assignees/:userId", removeAssignee);

export default router;
