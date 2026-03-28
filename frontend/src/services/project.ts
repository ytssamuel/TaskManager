import api from "@/lib/api";
import type { ApiResponse, Project } from "@/lib/types";
import type { ProjectInput } from "@/lib/validations";

export type { Project };

export const projectService = {
  async getProjects(): Promise<Project[]> {
    const response = await api.get<ApiResponse<Project[]>>("/projects");
    if (!response.data.success) {
      throw new Error(response.data.error?.message || "取得專案列表失敗");
    }
    return response.data.data || [];
  },

  async getProject(id: string): Promise<Project> {
    const response = await api.get<ApiResponse<Project>>(`/projects/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error?.message || "取得專案失敗");
    }
    return response.data.data!;
  },

  async createProject(data: ProjectInput): Promise<Project> {
    const response = await api.post<ApiResponse<Project>>("/projects", data);
    if (!response.data.success) {
      throw new Error(response.data.error?.message || "建立專案失敗");
    }
    return response.data.data!;
  },

  async updateProject(id: string, data: Partial<ProjectInput>): Promise<Project> {
    const response = await api.put<ApiResponse<Project>>(`/projects/${id}`, data);
    if (!response.data.success) {
      throw new Error(response.data.error?.message || "更新專案失敗");
    }
    return response.data.data!;
  },

  async deleteProject(id: string): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(`/projects/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error?.message || "刪除專案失敗");
    }
  },

  async getMembers(projectId: string) {
    const response = await api.get<ApiResponse<any[]>>(`/projects/${projectId}/members`);
    if (!response.data.success) {
      throw new Error(response.data.error?.message || "取得成員失敗");
    }
    return response.data.data || [];
  },

  async addMember(projectId: string, email: string, role: "ADMIN" | "MEMBER"): Promise<any> {
    const response = await api.post<ApiResponse<any>>(`/projects/${projectId}/members`, { email, role });
    if (!response.data.success) {
      throw new Error(response.data.error?.message || "新增成員失敗");
    }
    return response.data.data!;
  },

  async removeMember(projectId: string, userId: string): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(`/projects/${projectId}/members/${userId}`);
    if (!response.data.success) {
      throw new Error(response.data.error?.message || "移除成員失敗");
    }
  },
};
