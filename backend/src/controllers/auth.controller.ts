import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import prisma from "@/utils/prisma";
import { hashPassword, comparePassword, generateToken } from "@/utils/auth";
import { successResponse, errorResponse } from "@/utils/response";
import { AuthRequest, authMiddleware } from "@/middlewares/auth.middleware";

const registerSchema = z.object({
  username: z.string().min(3, "使用者名稱至少需要 3 個字元").max(50, "使用者名稱最多 50 個字元"),
  email: z.string().email("無效的 Email 格式"),
  password: z.string().min(8, "密碼至少需要 8 個字元"),
  name: z.string().min(2, "名稱至少需要 2 個字元").optional(),
});

const loginSchema = z.object({
  username: z.string().min(1, "請輸入使用者名稱"),
  password: z.string().min(1, "請輸入密碼"),
});

const updateProfileSchema = z.object({
  username: z.string().min(3, "使用者名稱至少需要 3 個字元").max(50).optional().nullable(),
  name: z.string().min(2, "名稱至少需要 2 個字元").optional().nullable(),
  avatarUrl: z.string().url("無效的 URL 格式").optional().nullable().or(z.literal("")),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "請輸入目前密碼"),
  newPassword: z.string().min(8, "新密碼至少需要 8 個字元"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "新密碼不相符",
  path: ["confirmPassword"],
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads/avatars");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("不支援的檔案格式"));
    }
  },
});

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = registerSchema.parse(req.body);

    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      res.status(409).json(errorResponse("CONFLICT", "此 Email 已被註冊"));
      return;
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUsername) {
      res.status(409).json(errorResponse("CONFLICT", "此使用者名稱已被使用"));
      return;
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        name: data.name || data.username,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    const accessToken = generateToken({ userId: user.id, email: user.email });

    res.status(201).json(
      successResponse({
        user,
        accessToken,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (!user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "使用者名稱或密碼錯誤"));
      return;
    }

    const isValidPassword = await comparePassword(data.password, user.password);

    if (!isValidPassword) {
      res.status(401).json(errorResponse("AUTH_ERROR", "使用者名稱或密碼錯誤"));
      return;
    }

    const accessToken = generateToken({ userId: user.id, email: user.email });

    res.json(
      successResponse({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          avatarUrl: user.avatarUrl,
        },
        accessToken,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json(errorResponse("NOT_FOUND", "用戶不存在"));
      return;
    }

    res.json(successResponse(user));
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const data = updateProfileSchema.parse(req.body);

    // Filter out undefined/null values for Prisma
    const updateData: Record<string, unknown> = {};
    if (data.username !== undefined && data.username !== null) updateData.username = data.username;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.avatarUrl !== undefined && data.avatarUrl !== null && data.avatarUrl !== "") updateData.avatarUrl = data.avatarUrl;

    if (data.username) {
      const existingUsername = await prisma.user.findFirst({
        where: {
          username: data.username,
          NOT: { id: req.user.userId },
        },
      });

      if (existingUsername) {
        res.status(409).json(errorResponse("CONFLICT", "此使用者名稱已被使用"));
        return;
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatarUrl: true,
        updatedAt: true,
      },
    });

    res.json(successResponse(user));
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  res.json(successResponse({ message: "已成功登出" }));
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const data = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      res.status(404).json(errorResponse("NOT_FOUND", "用戶不存在"));
      return;
    }

    const isValidPassword = await comparePassword(data.currentPassword, user.password);
    if (!isValidPassword) {
      res.status(401).json(errorResponse("AUTH_ERROR", "目前密碼錯誤"));
      return;
    }

    const hashedPassword = await hashPassword(data.newPassword);

    await prisma.user.update({
      where: { id: req.user.userId },
      data: { password: hashedPassword },
    });

    res.json(successResponse({ message: "密碼已更新" }));
  } catch (error) {
    next(error);
  }
};

export const uploadAvatar = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    upload.single("avatar")(req, res, async (err) => {
      if (err instanceof Error) {
        res.status(400).json(errorResponse("VALIDATION_ERROR", err.message));
        return;
      }

      if (!req.file) {
        res.status(400).json(errorResponse("VALIDATION_ERROR", "請選擇圖片檔案"));
        return;
      }

      const oldUser = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: { avatarUrl: true },
      });

      if (oldUser?.avatarUrl && oldUser.avatarUrl.startsWith("/uploads/")) {
        const oldPath = path.join(process.cwd(), oldUser.avatarUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      const user = await prisma.user.update({
        where: { id: req.user!.userId },
        data: { avatarUrl },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          avatarUrl: true,
          updatedAt: true,
        },
      });

      res.json(successResponse(user));
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { confirmPassword } = req.body;

    if (!confirmPassword) {
      res.status(400).json(errorResponse("VALIDATION_ERROR", "請輸入密碼以確認"));
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      res.status(404).json(errorResponse("NOT_FOUND", "用戶不存在"));
      return;
    }

    const isValidPassword = await comparePassword(confirmPassword, user.password);
    if (!isValidPassword) {
      res.status(401).json(errorResponse("AUTH_ERROR", "密碼錯誤"));
      return;
    }

    if (user.avatarUrl && user.avatarUrl.startsWith("/uploads/")) {
      const avatarPath = path.join(process.cwd(), user.avatarUrl);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    await prisma.user.delete({
      where: { id: req.user.userId },
    });

    res.json(successResponse({ message: "帳號已刪除" }));
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  getMe,
  updateProfile,
  logout,
  changePassword,
  uploadAvatar,
  deleteAccount,
};
