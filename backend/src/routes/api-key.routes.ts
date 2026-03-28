import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import prisma from "@/utils/prisma";
import { successResponse, errorResponse } from "@/utils/response";
import { AuthRequest, authMiddleware } from "@/middlewares/auth.middleware";

const router = Router();

const createApiKeySchema = z.object({
  name: z.string().min(1, "請輸入 API Key 名稱").max(100, "名稱最多 100 個字元"),
  role: z.enum(["READ_ONLY", "MEMBER", "ADMIN", "OWNER"]).default("MEMBER"),
  projectId: z.string().uuid("無效的專案 ID").optional().nullable(),  // 可選：限定只能訪問特定專案
  expiresAt: z.string().datetime().optional().nullable(),
});

function generateApiKey(): string {
  const randomPart = crypto.randomBytes(8).toString("hex");
  return `tm_live_${randomPart}`;
}

export const createApiKey = async (req: AuthRequest, res: any): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const data = createApiKeySchema.parse(req.body);

    const apiKey = await prisma.apiKey.create({
      data: {
        name: data.name,
        key: generateApiKey(),
        role: data.role,
        userId: req.user.userId,
        projectId: data.projectId || null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
      select: {
        id: true,
        name: true,
        key: true,
        role: true,
        projectId: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    res.status(201).json(successResponse(apiKey));
  } catch (error: any) {
    console.error("Error creating API key:", error);
    if (error instanceof z.ZodError) {
      res.status(400).json(errorResponse("VALIDATION_ERROR", error.errors[0].message));
      return;
    }
    // Log the actual Prisma error
    if (error.code) {
      console.error("Prisma error code:", error.code);
      console.error("Prisma error message:", error.message);
    }
    res.status(500).json(errorResponse("INTERNAL_ERROR", "伺服器錯誤"));
  }
};

export const listApiKeys = async (req: AuthRequest, res: any): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: req.user.userId },
      select: {
        id: true,
        name: true,
        key: true,
        role: true,
        projectId: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(successResponse(apiKeys));
  } catch (error) {
    res.status(500).json(errorResponse("INTERNAL_ERROR", "伺服器錯誤"));
  }
};

export const deleteApiKey = async (req: AuthRequest, res: any): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { id } = req.params;

    const existingKey = await prisma.apiKey.findFirst({
      where: { id, userId: req.user.userId },
    });

    if (!existingKey) {
      res.status(404).json(errorResponse("NOT_FOUND", "API Key 不存在"));
      return;
    }

    await prisma.apiKey.delete({
      where: { id },
    });

    res.json(successResponse({ message: "API Key 已刪除" }));
  } catch (error) {
    res.status(500).json(errorResponse("INTERNAL_ERROR", "伺服器錯誤"));
  }
};

router.post("/", authMiddleware, createApiKey);
router.get("/", authMiddleware, listApiKeys);
router.delete("/:id", authMiddleware, deleteApiKey);

export default router;
