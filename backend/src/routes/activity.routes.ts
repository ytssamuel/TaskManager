import { Router } from "express";
import prisma from "@/utils/prisma";
import { successResponse, errorResponse } from "@/utils/response";
import { AuthRequest, authMiddleware } from "@/middlewares/auth.middleware";
import { getProjectActivities, getTaskActivities } from "@/utils/activity";

const router = Router();

// 獲取項目的活動日誌
router.get("/projects/:projectId/activities", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    // 檢查用戶是否為項目成員
    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: req.user!.userId,
      },
    });

    if (!membership) {
      res.status(403).json(errorResponse("FORBIDDEN", "你無權訪問此項目"));
      return;
    }

    const activities = await getProjectActivities(projectId, limit);
    res.json(successResponse(activities));
  } catch (error) {
    console.error("Error fetching project activities:", error);
    res.status(500).json(errorResponse("INTERNAL_ERROR", "伺服器錯誤"));
  }
});

// 獲取任務的活動日誌
router.get("/tasks/:taskId/activities", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { taskId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;

    // 獲取任務所屬項目
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      res.status(404).json(errorResponse("NOT_FOUND", "任務不存在"));
      return;
    }

    // 檢查用戶是否為項目成員
    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId: task.projectId,
        userId: req.user!.userId,
      },
    });

    if (!membership) {
      res.status(403).json(errorResponse("FORBIDDEN", "你無權訪問此任務"));
      return;
    }

    const activities = await getTaskActivities(taskId, limit);
    res.json(successResponse(activities));
  } catch (error) {
    console.error("Error fetching task activities:", error);
    res.status(500).json(errorResponse("INTERNAL_ERROR", "伺服器錯誤"));
  }
});

export default router;
