export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  joinedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  owner?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  members?: ProjectMember[];
  membersCount?: number;
  tasksCount?: {
    total: number;
    done: number;
  };
  columns?: Column[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  orderIndex: number;
  dueDate?: string;
  parentTaskId?: string | null;
  assignee?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  createdBy: {
    id: string;
    name: string;
  };
  dependencies: TaskDependency[];
  assignees?: { id: string; name: string; avatarUrl?: string }[];
  childCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  childCount: number;
  assignee?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export interface FieldConflict {
  field: "title" | "description" | "priority" | "status" | "dueDate" | "assignees";
  values: { taskId: string; value: any }[];
  suggestedValue: any;
}

export interface MergePreview {
  conflicts: FieldConflict[];
  preview: {
    title: string;
    description?: string;
    priority: Priority;
    status: TaskStatus;
    dueDate?: string;
    assignees: { id: string; name: string; avatarUrl?: string }[];
    dependencies: string[];
  };
}

export interface SplitItem {
  title: string;
  description: string;
  priority?: Priority;
}

export interface ConvertToProjectData {
  projectName: string;
  projectDescription?: string;
  taskIds: string[];
}

export interface TaskDependency {
  id: string;
  dependsOn: {
    id: string;
    title: string;
    status: TaskStatus;
  };
}

export interface Column {
  id: string;
  name: string;
  orderIndex: number;
  isLocked: boolean;
  projectId?: string;
}

export type TaskStatus = "BACKLOG" | "READY" | "IN_PROGRESS" | "REVIEW" | "DONE";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}
