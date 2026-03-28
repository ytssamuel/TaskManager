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

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json(errorResponse("AUTH_ERROR", "未提供認證 token"));
    return;
  }

  const token = extractToken(authHeader);

  if (!token) {
    res.status(401).json(errorResponse("AUTH_ERROR", "無效的認證格式"));
    return;
  }

  // Check if it's an API Key
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

    // Update last used
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    req.user = {
      userId: apiKey.userId,
      email: apiKey.user.email,
      role: apiKey.role,
      isApiKey: true,
      apiKeyRole: apiKey.role,
      apiKeyProjectId: apiKey.projectId,
    };
    next();
    return;
  }

  // Otherwise, verify as JWT
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json(errorResponse("AUTH_ERROR", "無效或已過期的 token"));
    return;
  }

  req.user = payload;
  next();
}

export function optionalAuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const token = extractToken(req.headers.authorization);

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  next();
}
