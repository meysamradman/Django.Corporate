import type {
  Agent,
  AgentListParams,
  AgentListResponse,
} from "@/types/real-estate/agent";
import { fetchApi } from "@/core/config/fetch";
import { toPaginatedResponse, withQuery } from "@/api/shared";

/**
 * Agent & Agency API
 * Public endpoints for fetching agents and agencies
 */
export const agentApi = {
  /**
   * Get list of agents with pagination and filters
   */
  async getAgents(params: AgentListParams = {}): Promise<AgentListResponse> {
    const limit = params.size;
    const offset = params.page && params.size ? (params.page - 1) * params.size : undefined;

    const queryParams = {
      ...params,
      limit,
      offset,
      page: undefined,
      size: undefined,
      ordering: params.order_by
        ? `${params.order_desc ? "-" : ""}${params.order_by}`
        : undefined,
      order_by: undefined,
      order_desc: undefined,
    } as Record<string, unknown>;

    const response = await fetchApi.get<Agent[]>(
      withQuery("/real-estate/agents/", queryParams)
    );

    return toPaginatedResponse<Agent>(response, params.size || 10) as AgentListResponse;
  },

  /**
   * Get single agent by slug
   */
  async getAgentBySlug(slug: string): Promise<Agent> {
    const response = await fetchApi.get<Agent>(`/real-estate/agents/${slug}/`);
    return response.data;
  },

  async getAgentByNumericId(id: string | number): Promise<Agent> {
    const response = await fetchApi.get<Agent>(`/real-estate/agents/id/${id}/`);
    return response.data;
  },

  async getAgentByPublicId(publicId: string): Promise<Agent> {
    const response = await fetchApi.get<Agent>(`/real-estate/agents/p/${publicId}/`);
    return response.data;
  },

  /**
   * Get featured agents (top rated, verified)
   */
  async getFeaturedAgents(limit: number = 6): Promise<Agent[]> {
    const response = await fetchApi.get<Agent[]>(
      withQuery("/real-estate/agents/featured/", { limit })
    );
    return response.data;
  },
};
