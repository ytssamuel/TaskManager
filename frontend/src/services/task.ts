import api from "@/lib/api";
import type { ApiResponse, Task, Column, Subtask, MergePreview, SplitItem } from "@/lib/types";
import type { TaskInput } from "@/lib/validations";

export const taskService = {
  async getProjectTasks(projectId: string): Promise<{ tasks: Task[]; columns: Column[] }> {
    const response = await api.get<ApiResponse<{ tasks: Task[]; columns: Column[] }>>(`/tasks/project/${projectId}`);
    if (!response.data.success) {
      throw new Error(response.data.error?.message || "取得任務失敗");
    }
    return response.data.data!;
  },

  async getTask(id: string): Promise<Task> {
    const response = await api.get<ApiResponse<Task>>(`/tasks/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error?.message || "取得任務失敗");
    }
    return response.data.data!;
  },

  async createTask(data: TaskInput & { projectId: string }): Promise<Task> {
    const response = await api.post<ApiResponse<Task>>("/tasks", data);
    if (!response.data.success) {
      throw new Error(response.data.error?.message || "建立任務失敗");
    }
    return response.data.data!;
  },

  async updateTask(id: string, data: Partial<TaskInput>): Promise<Task> {
    const response = await api.put<ApiResponse<Task>>(`/tasks/${id}`, data);
    if (!response.data.success) {
      throw new Error(response.data.error?.message || "更新任務失敗");
    }
    return response.data.data!;
  },

  async deleteTask(id: string): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(`/tasks/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error?.message || "刪除任務失敗");
    }
  },

  async updateStatus(id: string, status: string): Promise<Task> {
    const response = await api.put<ApiResponse<Task>>(`/tasks/${id}/status`, { status });
    if (!response.data.success) {
      throw new Error(response.data.error?.message || "更新狀態失敗");
    }
    return response.data.data!;
  },

  async reorderTask(id: string, orderIndex: number, columnId: string): Promise<Task> {
    const response = await api.put<ApiResponse<Task>>(`/tasks/${id}/order`, { orderIndex, columnId });
    if (!response.data.success) {
      throw new Error(response.data.error?.message || "更新排序失敗");
    }
    return response.data.data!;
  },

  async addDependency(taskId: string, dependsOnId: string): Promise<any> {
    const response = await api.post<ApiResponse<any>>(`/tasks/${taskId}/dependencies`, { dependsOnId });
    if (!response.data.success) {
      throw new Error(response.data.error?.message || "新增依賴失敗");
    }
    return response.data.data!;
  },

  async removeDependency(taskId: string, depId: string): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(`/tasks/${taskId}/dependencies/${depId}`);
    if (!response.data.success) {
      throw new Error(response.data.error?.message || "移除依賴失敗");
    }
  },

  async getSubtasks(taskId: string): Promise<{ subtasks: Subtask[]; totalCount: number }> {
    const response = await api.get<ApiResponse<{ subtasks: Subtask[]; totalCount: number }>>(`/tasks/${taskId}/subtasks`);
    if (!response.data.success) {
      throw new Error(response.data.error?.message || "取得子任務失敗");
    }
    return response.data.data!;
  },

  async createSubtask(parentId: string, data: { title: string; description?: string; priority?: string; status?: string }): Promise<Task> {
    const response = await api.post<ApiResponse<Task>>(`/tasks/${parentId}/subtasks`, data);
    if (!response.data.success) {
      throw new Error(response.data.error?.message || "建立子任務失敗");
    }
    return response.data.data!;
  },

  async moveTask(taskId: string, parentTaskId: string | null): Promise<{ id: string; parentTaskId: string | null }> {
    const response = await api.put<ApiResponse<{ id: string; parentTaskId: string | null }>>(`/tasks/${taskId}/parent`, { parentTaskId });
    if (!response.data.success) {
      throw new Error(response.data.error?.message || "移動任務失敗");
    }
    return response.data.data!;
  },

  async mergePreview(taskIds: string[]): Promise<MergePreview> {
    const response = await api.post<ApiResponse<MergePreview>>("/tasks/merge-preview", { taskIds });
    if (!response.data.success) {
      throw new Error(response.data.error?.message || "取得合併預覽失敗");
    }
    return response.data.data!;
  },

  async mergeTasks(taskIds: string[], mergedData: {
    title: string;
    description?: string;
    priority: string;
    status: string;
    assigneeIds?: string[];
    dueDate?: string;
  }): Promise<{ mergedTask: Task; sourceTaskIds: string[] }> {
    const response = await api.post<ApiResponse<{ mergedTask: Task; sourceTaskIds: string[] }>>("/tasks/merge", { taskIds, mergedData });
    if (!response.data.success) {
      throw new Error(response.data.error?.message || "合併任務失敗");
    }
    return response.data.data!;
  },

  async splitTask(taskId: string, splits: SplitItem[]): Promise<{ newTasks: Task[]; sourceTaskId: string }> {
    const response = await api.post<ApiResponse<{ newTasks: Task[]; sourceTaskId: string }>>(`/tasks/${taskId}/split`, { splits });
    if (!response.data.success) {
      throw new Error(response.data.error?.message || "拆分任務失敗");
    }
    return response.data.data!;
  },

  async convertToProject(data: { projectName: string; projectDescription?: string; taskIds: string[] }): Promise<{ project: { id: string; name: string }; movedTasks: { id: string; projectId: string }[] }> {
    const response = await api.post<ApiResponse<{ project: { id: string; name: string }; movedTasks: { id: string; projectId: string }[] }>>("/tasks/convert-to-project", data);
    if (!response.data.success) {
      throw new Error(response.data.error?.message || "轉換為專案失敗");
    }
    return response.data.data!;
  },
};
