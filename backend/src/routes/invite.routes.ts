import { Router, Response, NextFunction } from "express";
import { z } from "zod";
import prisma from "@/utils/prisma";
import { successResponse, errorResponse } from "@/utils/response";
import { AuthRequest, authMiddleware } from "@/middlewares/auth.middleware";

const router = Router();

const createInviteSchema = z.object({
  projectId: z.string().uuid("無效的專案 ID"),
  email: z.string().email("無效的 email 格式"),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
  expiresInDays: z.number().int().min(1).max(30).default(7),
});

function generateToken(): string {
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `invite_${randomPart}`;
}

function getBaseUrl(): string {
  return process.env.FRONTEND_URL || process.env.CORS_ORIGIN || "http://localhost:5173";
}

export const createInvite = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const data = createInviteSchema.parse(req.body);

    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId: data.projectId,
        userId: req.user.userId,
        role: { in: ["OWNER", "ADMIN"] },
      },
    });

    if (!membership) {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "無權限邀請成員"));
      return;
    }

    const existingInvite = await prisma.projectInvite.findFirst({
      where: {
        projectId: data.projectId,
        email: data.email,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      res.status(409).json(errorResponse("CONFLICT", "該 email 已有有效的邀請"));
      return;
    }

    // Check if user is already a member
    const existingMember = await prisma.projectMember.findFirst({
      where: {
        projectId: data.projectId,
        user: { email: data.email },
      },
    });

    if (existingMember) {
      res.status(409).json(errorResponse("CONFLICT", "該用戶已是專案成員"));
      return;
    }

    // Check if user exists in the system
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + data.expiresInDays);

    const invite = await prisma.projectInvite.create({
      data: {
        projectId: data.projectId,
        email: data.email,
        role: data.role,
        token,
        expiresAt,
        createdById: req.user.userId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const inviteLink = `${getBaseUrl()}/join/${token}`;

    res.status(201).json(successResponse({ 
      invite, 
      inviteLink,
      userExists: !!existingUser,
    }));
  } catch (error) {
    next(error);
  }
};

export const verifyInvite = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.params;

    const invite = await prisma.projectInvite.findUnique({
      where: { token },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invite) {
      res.status(404).json(errorResponse("NOT_FOUND", "邀請碼不存在"));
      return;
    }

    if (invite.acceptedAt) {
      res.status(400).json(errorResponse("INVALID_INVITE", "邀請碼已被使用"));
      return;
    }

    if (invite.expiresAt < new Date()) {
      res.status(400).json(errorResponse("EXPIRED_INVITE", "邀請碼已過期"));
      return;
    }

    res.json(successResponse({
      email: invite.email,
      role: invite.role,
      project: invite.project,
      createdBy: invite.createdBy,
      expiresAt: invite.expiresAt,
    }));
  } catch (error) {
    next(error);
  }
};

export const acceptInvite = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { token } = req.params;

    const invite = await prisma.projectInvite.findUnique({
      where: { token },
      include: {
        project: true,
      },
    });

    if (!invite) {
      res.status(404).json(errorResponse("NOT_FOUND", "邀請碼不存在"));
      return;
    }

    if (invite.acceptedAt) {
      res.status(400).json(errorResponse("INVALID_INVITE", "邀請碼已被使用"));
      return;
    }

    if (invite.expiresAt < new Date()) {
      res.status(400).json(errorResponse("EXPIRED_INVITE", "邀請碼已過期"));
      return;
    }

    if (invite.email.toLowerCase() !== req.user.email.toLowerCase()) {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "此邀請碼不屬於您的帳號"));
      return;
    }

    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: invite.projectId,
          userId: req.user.userId,
        },
      },
    });

    if (existingMember) {
      res.status(409).json(errorResponse("CONFLICT", "您已是專案成員"));
      return;
    }

    await prisma.$transaction([
      prisma.projectInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      }),
      prisma.projectMember.create({
        data: {
          projectId: invite.projectId,
          userId: req.user.userId,
          role: invite.role,
        },
      }),
    ]);

    res.json(successResponse({ message: "已成功加入專案" }));
  } catch (error) {
    next(error);
  }
};

export const deleteInvite = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { id } = req.params;

    const invite = await prisma.projectInvite.findUnique({
      where: { id },
    });

    if (!invite) {
      res.status(404).json(errorResponse("NOT_FOUND", "邀請不存在"));
      return;
    }

    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId: invite.projectId,
        userId: req.user.userId,
        role: { in: ["OWNER", "ADMIN"] },
      },
    });

    if (!membership) {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "無權限取消邀請"));
      return;
    }

    await prisma.projectInvite.delete({
      where: { id },
    });

    res.json(successResponse({ message: "邀請已取消" }));
  } catch (error) {
    next(error);
  }
};

// List all invites for a project
export const listInvites = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { projectId } = req.query;

    if (!projectId || typeof projectId !== "string") {
      res.status(400).json(errorResponse("VALIDATION_ERROR", "請提供專案 ID"));
      return;
    }

    // Check if user is member of the project
    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: req.user.userId,
      },
    });

    if (!membership) {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "無權限查看邀請"));
      return;
    }

    const invites = await prisma.projectInvite.findMany({
      where: {
        projectId,
        acceptedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(successResponse(invites));
  } catch (error) {
    next(error);
  }
};

router.get("/", authMiddleware, listInvites);
router.post("/", authMiddleware, createInvite);
router.get("/:token", authMiddleware, verifyInvite);
router.post("/:token/accept", authMiddleware, acceptInvite);
router.delete("/:id", authMiddleware, deleteInvite);

export default router;
