import { Response } from "express";
import { AuthRequest, getApiKeyPermissions } from "./api-key-auth.middleware";
import { errorResponse } from "@/utils/response";

export type PermissionAction = "read" | "create" | "edit" | "delete" | "manageProject";

export function checkApiKeyPermission(action: PermissionAction) {
  return (req: AuthRequest, res: Response, next: Function): void => {
    // 如果不是 API Key 請求，跳過檢查
    if (!req.user?.isApiKey) {
      next();
      return;
    }

    const permissions = getApiKeyPermissions(req.user.apiKeyRole);
    
    const actionMap: Record<PermissionAction, keyof typeof permissions> = {
      read: "canRead",
      create: "canCreate",
      edit: "canEdit",
      delete: "canDelete",
      manageProject: "canManageProject",
    };

    const requiredPermission = actionMap[action];

    if (!permissions[requiredPermission]) {
      const roleMessages: Record<string, string> = {
        READ_ONLY: "此 API Key 權限為唯讀，無法執行此操作",
        MEMBER: "此 API Key 權限為成員，無法執行此操作",
        ADMIN: "此 API Key 權限為管理員，無法執行此操作",
      };

      res.status(403).json(
        errorResponse(
          "PERMISSION_DENIED",
          roleMessages[req.user.apiKeyRole || "READ_ONLY"] || "權限不足"
        )
      );
      return;
    }

    // 如果 API Key 限定了專案，檢查是否匹配
    if (req.user.apiKeyProjectId && req.body.projectId) {
      if (req.user.apiKeyProjectId !== req.body.projectId) {
        res.status(403).json(
          errorResponse("PERMISSION_DENIED", "此 API Key 只能訪問指定的專案")
        );
        return;
      }
    }

    next();
  };
}
