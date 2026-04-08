import { Response, NextFunction } from "express";
import { z } from "zod";
import prisma from "@/utils/prisma";
import { successResponse, errorResponse } from "@/utils/response";
import { AuthRequest } from "@/middlewares/auth.middleware";

const isAdmin = (role?: string) => role === "ADMIN" || role === "OWNER";

const subtaskCreateSchema = z.object({
  title: z.string().min(1, "任務標題不能為空").max(200),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  status: z.enum(["BACKLOG", "READY", "IN_PROGRESS", "REVIEW", "DONE"]).default("BACKLOG"),
});

const moveTaskSchema = z.object({
  parentTaskId: z.string().uuid("無效的任務 ID").nullable(),
});

const mergePreviewSchema = z.object({
  taskIds: z.array(z.string().uuid()).min(2, "至少需要 2 個任務").max(10, "最多只能合併 10 個任務"),
});

const mergeExecuteSchema = z.object({
  taskIds: z.array(z.string().uuid()).min(2).max(10),
  mergedData: z.object({
    title: z.string().min(1).max(200),
    description: z.string().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    status: z.enum(["BACKLOG", "READY", "IN_PROGRESS", "REVIEW", "DONE"]),
    assigneeIds: z.array(z.string().uuid()).optional(),
    dueDate: z.string().datetime().optional().nullable(),
  }),
});

const splitExecuteSchema = z.object({
  splits: z.array(z.object({
    title: z.string().min(1).max(200),
    description: z.string(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  })).min(2, "至少需要拆分為 2 個任務").max(20, "最多只能拆分為 20 個任務"),
});

const convertToProjectSchema = z.object({
  projectName: z.string().min(1, "專案名稱不能為空").max(200),
  projectDescription: z.string().optional(),
  taskIds: z.array(z.string().uuid()).min(1, "至少需要選擇 1 個任務"),
});

async function checkProjectMembership(userId: string, projectId: string) {
  return prisma.projectMember.findFirst({
    where: { projectId, userId },
  });
}

async function checkCyclicDependency(taskId: string, newParentId: string): Promise<boolean> {
  let currentId: string | null = newParentId;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === taskId) return true;
    if (visited.has(currentId)) return false;
    visited.add(currentId);

    const parentTask: { parentTaskId: string | null } | null = await prisma.task.findUnique({
      where: { id: currentId },
      select: { parentTaskId: true },
    });
    currentId = parentTask?.parentTaskId ?? null;
  }
  return false;
}

async function collectAllSubtaskIds(parentId: string): Promise<string[]> {
  const allIds: string[] = [];
  const queue: string[] = [parentId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const subtasks = await prisma.task.findMany({
      where: { parentTaskId: currentId },
      select: { id: true },
    });

    for (const subtask of subtasks) {
      allIds.push(subtask.id);
      queue.push(subtask.id);
    }
  }

  return allIds;
}

export const getSubtasks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!task) {
      res.status(404).json(errorResponse("NOT_FOUND", "任務不存在"));
      return;
    }

    const membership = await checkProjectMembership(req.user.userId, task.projectId);
    if (!membership) {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "無權限"));
      return;
    }

    const subtasks = await prisma.task.findMany({
      where: { parentTaskId: id },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { orderIndex: "asc" },
    });

    const totalCount = subtasks.length;

    res.json(successResponse({ subtasks, totalCount }));
  } catch (error) {
    next(error);
  }
};

export const createSubtask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { id } = req.params;
    const data = subtaskCreateSchema.parse(req.body);

    const parentTask = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!parentTask) {
      res.status(404).json(errorResponse("NOT_FOUND", "父任務不存在"));
      return;
    }

    const membership = await checkProjectMembership(req.user.userId, parentTask.projectId);
    if (!membership) {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "無權限"));
      return;
    }

    if (!isAdmin(req.user.role) && membership.role === "MEMBER") {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "成員無法新增子任務"));
      return;
    }

    const lastSubtask = await prisma.task.findFirst({
      where: { parentTaskId: id },
      orderBy: { orderIndex: "desc" },
    });

    const subtask = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: data.status,
        projectId: parentTask.projectId,
        parentTaskId: id,
        createdById: req.user.userId,
        orderIndex: (lastSubtask?.orderIndex ?? -1) + 1,
      },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(successResponse(subtask));
  } catch (error) {
    next(error);
  }
};

export const moveTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { id } = req.params;
    const { parentTaskId } = moveTaskSchema.parse(req.body);

    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!task) {
      res.status(404).json(errorResponse("NOT_FOUND", "任務不存在"));
      return;
    }

    const membership = await checkProjectMembership(req.user.userId, task.projectId);
    if (!membership) {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "無權限"));
      return;
    }

    if (!isAdmin(req.user.role) && membership.role === "MEMBER") {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "成員無法移動任務"));
      return;
    }

    if (parentTaskId) {
      const newParent = await prisma.task.findUnique({
        where: { id: parentTaskId },
      });

      if (!newParent) {
        res.status(404).json(errorResponse("NOT_FOUND", "目標父任務不存在"));
        return;
      }

      if (newParent.projectId !== task.projectId) {
        res.status(400).json(errorResponse("VALIDATION_ERROR", "只能在同一專案內移動任務"));
        return;
      }

      if (parentTaskId === id) {
        res.status(400).json(errorResponse("VALIDATION_ERROR", "任務不能是自己的父任務"));
        return;
      }

      const wouldCreateCycle = await checkCyclicDependency(id, parentTaskId);
      if (wouldCreateCycle) {
        res.status(400).json(errorResponse("CIRCULAR_DEPENDENCY", "移動任務會形成循環依賴"));
        return;
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { parentTaskId },
    });

    res.json(successResponse({ id: updatedTask.id, parentTaskId: updatedTask.parentTaskId }));
  } catch (error) {
    next(error);
  }
};

export const mergePreview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { taskIds } = mergePreviewSchema.parse(req.body);

    const tasks = await prisma.task.findMany({
      where: { id: { in: taskIds } },
      include: {
        assignees: { select: { id: true, name: true, avatarUrl: true } },
        dependencies: { include: { dependsOn: true } },
        dependentOn: true,
      },
    });

    if (tasks.length !== taskIds.length) {
      res.status(404).json(errorResponse("NOT_FOUND", "部分任務不存在"));
      return;
    }

    const projectIds = new Set(tasks.map((t) => t.projectId));
    if (projectIds.size > 1) {
      res.status(400).json(errorResponse("VALIDATION_ERROR", "只能合併同一專案內的任務"));
      return;
    }

    const projectId = tasks[0].projectId;
    const membership = await checkProjectMembership(req.user.userId, projectId);
    if (!membership) {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "無權限"));
      return;
    }

    const conflicts: any[] = [];
    const priorityValues = [...new Set(tasks.map((t) => t.priority))];
    if (priorityValues.length > 1) {
      const priorityOrder: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      conflicts.push({
        field: "priority",
        values: tasks.map((t) => ({ taskId: t.id, value: t.priority })),
        suggestedValue: priorityValues.sort((a, b) => priorityOrder[a] - priorityOrder[b])[0],
      });
    }

    const statusValues = [...new Set(tasks.map((t) => t.status))];
    if (statusValues.length > 1) {
      const statusOrder: Record<string, number> = { BACKLOG: 0, READY: 1, IN_PROGRESS: 2, REVIEW: 3, DONE: 4 };
      conflicts.push({
        field: "status",
        values: tasks.map((t) => ({ taskId: t.id, value: t.status })),
        suggestedValue: statusValues.sort((a, b) => statusOrder[a] - statusOrder[b])[0],
      });
    }

    const dueDates = tasks.map((t) => t.dueDate);
    const uniqueDueDates = dueDates.filter((d) => d !== null);
    if (uniqueDueDates.length > 1) {
      conflicts.push({
        field: "dueDate",
        values: tasks.map((t) => ({ taskId: t.id, value: t.dueDate })),
        suggestedValue: uniqueDueDates.sort((a, b) => new Date(a!).getTime() - new Date(b!).getTime())[0],
      });
    }

    const allAssignees = tasks.flatMap((t) => t.assignees);
    const assigneeIds = [...new Set(allAssignees.map((a) => a.id))];
    if (assigneeIds.length > tasks.length) {
      conflicts.push({
        field: "assignees",
        values: tasks.map((t) => ({ taskId: t.id, value: t.assignees })),
        suggestedValue: allAssignees,
      });
    }

    const mergedDescription = tasks
      .map((t) => t.description)
      .filter((d) => d)
      .join("\n---\n");

    const preview = {
      title: tasks[0].title,
      description: mergedDescription || undefined,
      priority: conflicts.find((c) => c.field === "priority")?.suggestedValue ?? tasks[0].priority,
      status: conflicts.find((c) => c.field === "status")?.suggestedValue ?? tasks[0].status,
      assignees: allAssignees,
      dependencies: tasks.flatMap((t) => t.dependencies.map((d) => d.dependsOnId)),
    };

    res.json(successResponse({ conflicts, preview }));
  } catch (error) {
    next(error);
  }
};

export const mergeTasks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { taskIds, mergedData } = mergeExecuteSchema.parse(req.body);

    const tasks = await prisma.task.findMany({
      where: { id: { in: taskIds } },
      include: {
        assignees: true,
        comments: true,
        dependencies: true,
      },
    });

    if (tasks.length !== taskIds.length) {
      res.status(404).json(errorResponse("NOT_FOUND", "部分任務不存在"));
      return;
    }

    const projectIds = new Set(tasks.map((t) => t.projectId));
    if (projectIds.size > 1) {
      res.status(400).json(errorResponse("VALIDATION_ERROR", "只能合併同一專案內的任務"));
      return;
    }

    const projectId = tasks[0].projectId;
    const membership = await checkProjectMembership(req.user.userId, projectId);
    if (!membership) {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "無權限"));
      return;
    }

    if (!isAdmin(req.user.role) && membership.role === "MEMBER") {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "成員無法合併任務"));
      return;
    }

    const userId = req.user.userId;

    const mergedTask = await prisma.$transaction(async (tx) => {
      const newTask = await tx.task.create({
        data: {
          title: mergedData.title,
          description: mergedData.description,
          priority: mergedData.priority,
          status: mergedData.status,
          dueDate: mergedData.dueDate ? new Date(mergedData.dueDate) : null,
          projectId: projectId,
          createdById: userId,
          orderIndex: Math.min(...tasks.map((t) => t.orderIndex)),
        },
        include: {
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          assignees: true,
        },
      });

      if (mergedData.assigneeIds && mergedData.assigneeIds.length > 0) {
        await tx.task.update({
          where: { id: newTask.id },
          data: {
            assignees: {
              connect: mergedData.assigneeIds.map((id) => ({ id })),
            },
          },
        });
      }

      for (const comment of tasks.flatMap((t) => t.comments)) {
        await tx.taskComment.create({
          data: {
            content: comment.content,
            taskId: newTask.id,
            userId: comment.userId,
          },
        });
      }

      for (const dep of tasks.flatMap((t) => t.dependencies)) {
        if (taskIds.includes(dep.dependsOnId)) {
          await tx.taskDependency.create({
            data: {
              taskId: newTask.id,
              dependsOnId: dep.dependsOnId,
            },
          });
        } else {
          await tx.taskDependency.create({
            data: {
              taskId: newTask.id,
              dependsOnId: dep.dependsOnId,
            },
          });
        }
      }

      await tx.taskDependency.deleteMany({
        where: { taskId: { in: taskIds } },
      });

      await tx.task.deleteMany({
        where: { id: { in: taskIds } },
      });

      await tx.taskOperationLog.create({
        data: {
          type: "MERGE",
          sourceIds: taskIds,
          targetId: newTask.id,
          metadata: { mergedData },
          performedBy: userId,
        },
      });

      return newTask;
    });

    res.status(201).json(successResponse({ mergedTask, sourceTaskIds: taskIds }));
  } catch (error) {
    next(error);
  }
};

export const splitTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { id } = req.params;
    const { splits } = splitExecuteSchema.parse(req.body);

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        comments: true,
        dependencies: true,
        subtasks: true,
      },
    });

    if (!task) {
      res.status(404).json(errorResponse("NOT_FOUND", "任務不存在"));
      return;
    }

    if (task.parentTaskId !== null) {
      res.status(400).json(errorResponse("VALIDATION_ERROR", "子任務無法拆分，請選擇父任務拆分"));
      return;
    }

    const membership = await checkProjectMembership(req.user.userId, task.projectId);
    if (!membership) {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "無權限"));
      return;
    }

    if (!isAdmin(req.user.role) && membership.role === "MEMBER") {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "成員無法拆分任務"));
      return;
    }

    const userId = req.user.userId;

    const newTasks = await prisma.$transaction(async (tx) => {
      const createdTasks = [];

      for (let i = 0; i < splits.length; i++) {
        const split = splits[i];
        const newTask = await tx.task.create({
          data: {
            title: split.title,
            description: split.description,
            priority: split.priority ?? task.priority,
            status: "BACKLOG",
            projectId: task.projectId,
            createdById: task.createdById,
            orderIndex: task.orderIndex + i,
            parentTaskId: null,
          },
          include: {
            assignee: { select: { id: true, name: true, avatarUrl: true } },
          },
        });
        createdTasks.push(newTask);
      }

      if (task.comments.length > 0) {
        for (const comment of task.comments) {
          await tx.taskComment.create({
            data: {
              content: comment.content,
              taskId: createdTasks[0].id,
              userId: comment.userId,
            },
          });
        }
      }

      if (task.dependencies.length > 0) {
        for (const dep of task.dependencies) {
          await tx.taskDependency.create({
            data: {
              taskId: createdTasks[0].id,
              dependsOnId: dep.dependsOnId,
            },
          });
        }
      }

      const subtaskIds = await collectAllSubtaskIds(id);
      if (subtaskIds.length > 0) {
        await tx.task.deleteMany({
          where: { id: { in: subtaskIds } },
        });
      }

      await tx.task.delete({ where: { id } });

      await tx.taskOperationLog.create({
        data: {
          type: "SPLIT",
          sourceIds: [id],
          targetId: createdTasks[0].id,
          metadata: { splitCount: splits.length, splits },
          performedBy: userId,
        },
      });

      return createdTasks;
    });

    res.status(201).json(successResponse({ newTasks, sourceTaskId: id }));
  } catch (error) {
    next(error);
  }
};

export const convertToProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse("AUTH_ERROR", "未登入"));
      return;
    }

    const { projectName, projectDescription, taskIds } = convertToProjectSchema.parse(req.body);

    const tasks = await prisma.task.findMany({
      where: { id: { in: taskIds } },
      include: {
        subtasks: true,
        comments: true,
        dependencies: true,
        assignees: true,
      },
    });

    if (tasks.length !== taskIds.length) {
      res.status(404).json(errorResponse("NOT_FOUND", "部分任務不存在"));
      return;
    }

    const projectIds = new Set(tasks.map((t) => t.projectId));
    if (projectIds.size > 1) {
      res.status(400).json(errorResponse("VALIDATION_ERROR", "選擇的任務必須來自同一專案"));
      return;
    }

    const sourceProjectId = tasks[0].projectId;
    const membership = await checkProjectMembership(req.user.userId, sourceProjectId);
    if (!membership) {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "無權限"));
      return;
    }

    if (!isAdmin(req.user.role) && membership.role === "MEMBER") {
      res.status(403).json(errorResponse("PERMISSION_ERROR", "成員無法轉換任務為專案"));
      return;
    }

    const userId = req.user.userId;

    const allTaskIds = new Set<string>(taskIds);
    for (const task of tasks) {
      const subtaskIds = await collectAllSubtaskIds(task.id);
      subtaskIds.forEach((sid) => allTaskIds.add(sid));
    }

    const result = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name: projectName,
          description: projectDescription,
          ownerId: userId,
        },
      });

      await tx.projectMember.create({
        data: {
          projectId: project.id,
          userId: userId,
          role: "OWNER",
        },
      });

      const defaultColumns = [
        { name: "待整理", orderIndex: 0 },
        { name: "準備開始", orderIndex: 1 },
        { name: "進行中", orderIndex: 2 },
        { name: "待審核", orderIndex: 3 },
        { name: "已完成", orderIndex: 4 },
      ];

      for (const col of defaultColumns) {
        await tx.column.create({
          data: {
            ...col,
            projectId: project.id,
          },
        });
      }

      const taskIdMap = new Map<string, string>();

      for (const taskId of taskIds) {
        const task = tasks.find((t) => t.id === taskId)!;
        const newTask = await tx.task.create({
          data: {
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            orderIndex: task.orderIndex,
            dueDate: task.dueDate,
            projectId: project.id,
            createdById: task.createdById,
            assigneeId: task.assigneeId,
          },
        });
        taskIdMap.set(task.id, newTask.id);

        for (const comment of task.comments) {
          await tx.taskComment.create({
            data: {
              content: comment.content,
              taskId: newTask.id,
              userId: comment.userId,
            },
          });
        }
      }

      const allTasksToMove = await prisma.task.findMany({
        where: { id: { in: Array.from(allTaskIds) } },
        include: { dependencies: true },
      });

      for (const task of allTasksToMove) {
        if (!taskIdMap.has(task.id)) {
          const newTask = await tx.task.create({
            data: {
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
              orderIndex: task.orderIndex,
              dueDate: task.dueDate,
              projectId: project.id,
              createdById: task.createdById,
              assigneeId: task.assigneeId,
              parentTaskId: taskIdMap.get(task.parentTaskId!) || null,
            },
          });
          taskIdMap.set(task.id, newTask.id);
        }
      }

      for (const task of allTasksToMove) {
        for (const dep of task.dependencies) {
          const localTaskId = taskIdMap.get(task.id);
          const localDependsOnId = taskIdMap.get(dep.dependsOnId);

          if (localTaskId && localDependsOnId) {
            await tx.taskDependency.create({
              data: {
                taskId: localTaskId,
                dependsOnId: localDependsOnId,
              },
            });
          } else if (localTaskId && !localDependsOnId) {
            await tx.externalTaskDependency.create({
              data: {
                localTaskId,
                localProjectId: project.id,
                externalTaskId: dep.dependsOnId,
                externalProjectId: sourceProjectId,
              },
            });
          }
        }
      }

      await tx.task.deleteMany({
        where: { id: { in: Array.from(allTaskIds) } },
      });

      await tx.taskOperationLog.create({
        data: {
          type: "CONVERT_TO_PROJECT",
          sourceIds: Array.from(allTaskIds),
          targetId: project.id,
          metadata: { projectName, taskIds },
          performedBy: userId,
        },
      });

      const movedTasks = Array.from(taskIdMap.values()).map((newId) => ({
        id: newId,
        projectId: project.id,
      }));

      return { project, movedTasks };
    });

    res.status(201).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export default {
  getSubtasks,
  createSubtask,
  moveTask,
  mergePreview,
  mergeTasks,
  splitTask,
  convertToProject,
};
