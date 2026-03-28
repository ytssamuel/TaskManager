import { Request, Response, NextFunction } from "express";
import { verifyToken, extractToken, JWTPayload } from "@/utils/auth";
import { errorResponse } from "@/utils/response";
import prisma from "@/utils/prisma";

export interface AuthRequest extends Request {
  user?: JWTPayload & {
    isApiKey?: boolean;
    apiKeyRole?: string;
    apiKeyProjectId?: string | null;
  };
}

function isApiKey(key: string): boolean {
  return key.startsWith("tm_live_");
}

// API Key 權限矩陣
const API_KEY_PERMISSIONS = {
  READ_ONLY: {
    canRead: true,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canManageProject: false,
  },
  MEMBER: {
    canRead: true,
    canCreate: true,
    canEdit: false,
    canDelete: false,
    canManageProject: false,
  },
  ADMIN: {
    canRead: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canManageProject: false,
  },
  OWNER: {
    canRead: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canManageProject: true,
  },
};

export function getApiKeyPermissions(role?: string) {
  return API_KEY_PERMISSIONS[role as keyof typeof API_KEY_PERMISSIONS] || API_KEY_PERMISSIONS.READ_ONLY;
}

export async function apiKeyAuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json(errorResponse("AUTH_ERROR", "未提供認證資訊"));
    return;
  }

  const token = extractToken(authHeader);

  if (!token) {
    res.status(401).json(errorResponse("AUTH_ERROR", "無效的認證格式"));
    return;
  }

  if (isApiKey(token)) {
    const apiKey = await prisma.apiKey.findUnique({
      where: { key: token },
      include: { user: true },
    });

    if (!apiKey) {
      res.status(401).json(errorResponse("AUTH_ERROR", "無效的 API Key"));
      return;
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      res.status(401).json(errorResponse("AUTH_ERROR", "API Key 已過期"));
      return;
    }

    // 更新最後使用時間
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    // 使用 API Key 的 role，而不是帳號的 role
    req.user = {
      userId: apiKey.userId,
      email: apiKey.user.email,
      isApiKey: true,
      apiKeyRole: apiKey.role,
      apiKeyProjectId: apiKey.projectId,
    };
    next();
    return;
  }

  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json(errorResponse("AUTH_ERROR", "無效或已過期的 token"));
    return;
  }

  req.user = payload;
  next();
}
