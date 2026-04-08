import { vi } from "vitest";
import type { Subtask, MergePreview, Priority, TaskStatus } from "@/lib/types";

const mockSubtasks: Subtask[] = [
  {
    id: "subtask-1",
    title: "子任務 1",
    status: "BACKLOG" as TaskStatus,
    priority: "HIGH" as Priority,
    childCount: 0,
    assignee: { id: "user-1", name: "張三", avatarUrl: undefined },
  },
  {
    id: "subtask-2",
    title: "子任務 2",
    status: "IN_PROGRESS" as TaskStatus,
    priority: "MEDIUM" as Priority,
    childCount: 1,
  },
];

export const mockMergePreview: MergePreview = {
  conflicts: [
    {
      field: "priority",
      values: [
        { taskId: "task-1", value: "HIGH" },
        { taskId: "task-2", value: "LOW" },
      ],
      suggestedValue: "HIGH",
    },
    {
      field: "status",
      values: [
        { taskId: "task-1", value: "BACKLOG" },
        { taskId: "task-2", value: "IN_PROGRESS" },
      ],
      suggestedValue: "IN_PROGRESS",
    },
  ],
  preview: {
    title: "合併後的任務",
    description: "合併後的描述",
    priority: "HIGH",
    status: "IN_PROGRESS",
    dueDate: undefined,
    assignees: [
      { id: "user-1", name: "張三", avatarUrl: undefined },
      { id: "user-2", name: "李四", avatarUrl: undefined },
    ],
    dependencies: [],
  },
};

export const { taskServiceMock } = vi.hoisted(() => ({
  taskServiceMock: {
    getSubtasks: vi.fn().mockResolvedValue({
      subtasks: mockSubtasks,
      totalCount: 2,
    }),

    createSubtask: vi.fn().mockResolvedValue({
      id: "new-subtask",
      title: "新建的子任務",
      status: "BACKLOG" as TaskStatus,
      priority: "MEDIUM" as Priority,
      childCount: 0,
      parentTaskId: "parent-task-id",
    }),

    mergePreview: vi.fn().mockResolvedValue(mockMergePreview),

    mergeTasks: vi.fn().mockResolvedValue({
      mergedTask: {
        id: "merged-task-id",
        title: "合併後的任務",
        status: "BACKLOG" as TaskStatus,
        priority: "HIGH" as Priority,
        orderIndex: 0,
        dependencies: [],
        assignees: [],
        childCount: 0,
        createdBy: { id: "user-1", name: "張三" },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      sourceTaskIds: ["task-1", "task-2"],
    }),

    splitTask: vi.fn().mockResolvedValue({
      newTasks: [
        {
          id: "split-task-1",
          title: "拆分任務 1",
          status: "BACKLOG" as TaskStatus,
          priority: "MEDIUM" as Priority,
          orderIndex: 0,
          dependencies: [],
          assignees: [],
          childCount: 0,
          createdBy: { id: "user-1", name: "張三" },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "split-task-2",
          title: "拆分任務 2",
          status: "BACKLOG" as TaskStatus,
          priority: "MEDIUM" as Priority,
          orderIndex: 1,
          dependencies: [],
          assignees: [],
          childCount: 0,
          createdBy: { id: "user-1", name: "張三" },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      sourceTaskId: "original-task-id",
    }),

    convertToProject: vi.fn().mockResolvedValue({
      project: { id: "new-project-id", name: "新專案" },
      movedTasks: [{ id: "task-1", projectId: "new-project-id" }],
    }),

    getProjectTasks: vi.fn().mockResolvedValue({ tasks: [], columns: [] }),
    getTask: vi.fn().mockResolvedValue({}),
    createTask: vi.fn().mockResolvedValue({}),
    updateTask: vi.fn().mockResolvedValue({}),
    deleteTask: vi.fn().mockResolvedValue(undefined),
    updateStatus: vi.fn().mockResolvedValue({}),
    reorderTask: vi.fn().mockResolvedValue({}),
    addDependency: vi.fn().mockResolvedValue({}),
    removeDependency: vi.fn().mockResolvedValue(undefined),
    moveTask: vi.fn().mockResolvedValue({ id: "task-id", parentTaskId: null }),
  },
}));

vi.mock("@/services/task", () => ({
  taskService: taskServiceMock,
}));
