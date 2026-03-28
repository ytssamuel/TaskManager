import api from "@/lib/api";
import type { ApiResponse } from "@/lib/types";

export type ApiKeyRole = "READ_ONLY" | "MEMBER" | "ADMIN" | "OWNER";

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  role: ApiKeyRole;
  projectId: string | null;
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
}

export interface CreateApiKeyParams {
  name: string;
  role?: ApiKeyRole;
  projectId?: string | null;
}

export const apiKeyService = {
  async list(): Promise<ApiKey[]> {
    const response = await api.get<ApiResponse<ApiKey[]>>("/keys");
    if (!response.data.success) {
      throw new Error(response.data.error?.message || "取得 API Keys 失敗");
    }
    return response.data.data || [];
  },

  async create(params: CreateApiKeyParams): Promise<ApiKey> {
    const response = await api.post<ApiResponse<ApiKey>>("/keys", params);
    if (!response.data.success) {
      throw new Error(response.data.error?.message || "建立 API Key 失敗");
    }
    return response.data.data!;
  },

  async delete(id: string): Promise<void> {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/keys/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error?.message || "刪除 API Key 失敗");
    }
  },
};
