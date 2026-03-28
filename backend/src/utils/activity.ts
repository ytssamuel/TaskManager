import prisma from "@/utils/prisma";

export type ActivityType = 
  | "USER_REGISTERED"
  | "PROJECT_CREATED"
  | "PROJECT_UPDATED"
  | "PROJECT_DELETED"
  | "MEMBER_ADDED"
  | "MEMBER_REMOVED"
  | "MEMBER_ROLE_CHANGED"
  | "TASK_CREATED"
  | "TASK_UPDATED"
  | "TASK_DELETED"
  | "TASK_MOVED"
  | "COLUMN_CREATED"
  | "COLUMN_UPDATED"
  | "COLUMN_DELETED";

export interface CreateActivityParams {
  type: ActivityType;
  description: string;
  projectId: string;
  taskId?: string;
  userId: string;
  metadata?: Record<string, any>;
}

export async function createActivity(params: CreateActivityParams) {
  try {
    return await prisma.activity.create({
      data: {
        type: params.type,
        description: params.description,
        projectId: params.projectId,
        taskId: params.taskId,
        userId: params.userId,
        metadata: params.metadata || {},
      },
    });
  } catch (error) {
    console.error("Failed to create activity:", error);
  }
}

export async function getProjectActivities(projectId: string, limit = 50) {
  return prisma.activity.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
      task: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
}

export async function getTaskActivities(taskId: string, limit = 20) {
  return prisma.activity.findMany({
    where: { taskId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
  });
}
