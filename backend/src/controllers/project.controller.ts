import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import prisma from "@/utils/prisma";
import { successResponse, errorResponse } from "@/utils/response";
import { AuthRequest } from "@/middlewares/auth.middleware";

const createProjectSchema = z.object({
  name: z.string().min(1, "專案名稱不能為空").max(100, "專案名稱最多 100 個字元"),
  description: z.string().optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1, "專案名稱不能為空").max(100).optional(),
  description: z.string().optional().nullable(),
});

const addMemberSchema = z.object({
  email: z.string().email("無效的 email 格式"),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export const getProjects = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: {
            userId: req.user.userId,
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        members: {
          select: {
            id: true,
            role: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const projectsWithStats = projects.map((project) => {
      const doneTasks = project._count.tasks;
      return {
        ...project,
        membersCount: project.members.length,
        tasksCount: {
          total: project._count.tasks,
          done: doneTasks,
        },
      };
    });

    res.json(successResponse(projectsWithStats));
  } catch (error) {
    next(error);
  }
};

export const getProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id,
        members: {
          some: {
            userId: req.user.userId,
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        members: {
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
        },
        columns: {
          orderBy: {
            orderIndex: "asc",
          },
        },
      },
    });

    if (!project) {
      res.status(404).json(errorResponse("NOT_FOUND", "專案不存在或無權限"));
      return;
    }

    res.json(successResponse(project));
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const data = createProjectSchema.parse(req.body);

    const defaultColumns = [
      { name: "Backlog", orderIndex: 0, isLocked: false },
      { name: "Ready", orderIndex: 1, isLocked: true },
      { name: "In Progress", orderIndex: 2, isLocked: true },
      { name: "Review", orderIndex: 3, isLocked: true },
      { name: "Done", orderIndex: 4, isLocked: false },
    ];

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        ownerId: req.user.userId,
        members: {
          create: {
            userId: req.user.userId,
            role: "OWNER",
          },
        },
        columns: {
          create: defaultColumns,
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        members: true,
        columns: true,
      },
    });

    res.status(201).json(successResponse(project));
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { id } = req.params;
    const data = updateProjectSchema.parse(req.body);

    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId: id,
        userId: req.user.userId,
        role: { in: ["OWNER", "ADMIN"] },
      },
    });

    if (!membership) {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "無權限修改專案"));
      return;
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        members: {
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
        },
        columns: true,
      },
    });

    res.json(successResponse(project));
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { id } = req.params;

    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId: id,
        userId: req.user.userId,
        role: "OWNER",
      },
    });

    if (!membership) {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "只有擁有者可以刪除專案"));
      return;
    }

    await prisma.project.delete({
      where: { id },
    });

    res.json(successResponse({ message: "專案已刪除" }));
  } catch (error) {
    next(error);
  }
};

export const addMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { id } = req.params;
    const data = addMemberSchema.parse(req.body);

    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId: id,
        userId: req.user.userId,
        role: { in: ["OWNER", "ADMIN"] },
      },
    });

    if (!membership) {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "無權限新增成員"));
      return;
    }

    const userToAdd = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!userToAdd) {
      res.status(404).json(errorResponse("NOT_FOUND", "用戶不存在"));
      return;
    }

    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId: userToAdd.id,
        },
      },
    });

    if (existingMember) {
      res.status(409).json(errorResponse("CONFLICT", "該用戶已是專案成員"));
      return;
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId: id,
        userId: userToAdd.id,
        role: data.role,
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

    res.status(201).json(successResponse(member));
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { id, userId } = req.params;

    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId: id,
        userId: req.user.userId,
        role: { in: ["OWNER", "ADMIN"] },
      },
    });

    if (!membership) {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "無權限移除成員"));
      return;
    }

    const targetMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId,
        },
      },
    });

    if (!targetMember) {
      res.status(404).json(errorResponse("NOT_FOUND", "成員不存在"));
      return;
    }

    if (targetMember.role === "OWNER") {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "無法移除擁有者"));
      return;
    }

    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId: id,
          userId,
        },
      },
    });

    res.json(successResponse({ message: "成員已移除" }));
  } catch (error) {
    next(error);
  }
};

export const getMembers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { id } = req.params;

    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId: id,
        userId: req.user.userId,
      },
    });

    if (!membership) {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "無權限查看成員"));
      return;
    }

    const members = await prisma.projectMember.findMany({
      where: { projectId: id },
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
      orderBy: {
        joinedAt: "asc",
      },
    });

    res.json(successResponse(members));
  } catch (error) {
    next(error);
  }
};

export default {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  getMembers,
};
