import { Router, Response, NextFunction } from "express";
import { z } from "zod";
import prisma from "@/utils/prisma";
import { successResponse, errorResponse } from "@/utils/response";
import { AuthRequest } from "@/middlewares/auth.middleware";
import { authMiddleware } from "@/middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

const createCommentSchema = z.object({
  content: z.string().min(1, "留言內容不能為空").max(1000, "留言最多 1000 個字元"),
});

// Get all comments for a task
export const getComments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { taskId } = req.params;

    // Check if user is a member of the project
    const task = await prisma.task.findUnique({
      where: { id: taskId },
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
      res.status(403).json(errorResponse("PERMISSION_ERROR", "無權限查看留言"));
      return;
    }

    const comments = await prisma.taskComment.findMany({
      where: { taskId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json(successResponse(comments));
  } catch (error) {
    next(error);
  }
};

// Create a comment
export const createComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { taskId } = req.params;
    const data = createCommentSchema.parse(req.body);

    // Check if user is a member of the project
    const task = await prisma.task.findUnique({
      where: { id: taskId },
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
      res.status(403).json(errorResponse("PERMISSION_ERROR", "無權限新增留言"));
      return;
    }

    const comment = await prisma.taskComment.create({
      data: {
        content: data.content,
        taskId,
        userId: req.user.userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.status(201).json(successResponse(comment));
  } catch (error) {
    next(error);
  }
};

// Delete a comment (only author or ADMIN can delete)
export const deleteComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { taskId, commentId } = req.params;

    const comment = await prisma.taskComment.findUnique({
      where: { id: commentId },
    });

    if (!comment || comment.taskId !== taskId) {
      res.status(404).json(errorResponse("NOT_FOUND", "留言不存在"));
      return;
    }

    // Check if user is the author or ADMIN
    const isAuthor = comment.userId === req.user.userId;
    
    let isAdmin = false;
    if (!isAuthor) {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
      });
      const membership = await prisma.projectMember.findFirst({
        where: {
          projectId: task?.projectId,
          userId: req.user.userId,
        },
      });
      isAdmin = membership?.role === "OWNER" || membership?.role === "ADMIN";
    }

    if (!isAuthor && !isAdmin) {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "無權限刪除此留言"));
      return;
    }

    await prisma.taskComment.delete({
      where: { id: commentId },
    });

    res.json(successResponse({ message: "留言已刪除" }));
  } catch (error) {
    next(error);
  }
};

router.get("/:taskId/comments", getComments);
router.post("/:taskId/comments", createComment);
router.delete("/:taskId/comments/:commentId", deleteComment);

export default router;
