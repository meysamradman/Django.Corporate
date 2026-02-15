import { api } from '@/core/config/api';
import type { PaginatedResponse, ApiPagination } from "@/types/shared/pagination";
import { convertToLimitOffset } from '@/components/shared/paginations/pagination';
import type {
  EmailMessage,
  EmailMessageCreate,
  EmailMessageUpdate,
  EmailListParams,
  EmailStats
} from "@/types/email/emailMessage";

class EmailApi {
  private baseUrl = '/email/messages/';

  async getList(params: EmailListParams = {}): Promise<PaginatedResponse<EmailMessage>> {
    const { limit, offset } = convertToLimitOffset(params.page || 1, params.size || 10);

    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (limit) queryParams.append('limit', limit.toString());
    if (offset) queryParams.append('offset', offset.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.source) queryParams.append('source', params.source);
    if (params.order_by) {
      queryParams.append('ordering', params.order_desc ? `-${params.order_by}` : params.order_by);
    }

    const baseUrlWithQuery = this.baseUrl.endsWith('/')
      ? `${this.baseUrl}?${queryParams.toString()}`
      : `${this.baseUrl}/?${queryParams.toString()}`;

    const response = await api.get<EmailMessage[]>(baseUrlWithQuery);

    const pagination: ApiPagination = {
      count: response.pagination?.count || (Array.isArray(response.data) ? response.data.length : 0),
      next: response.pagination?.next || null,
      previous: response.pagination?.previous || null,
      page_size: response.pagination?.page_size || limit || 10,
      current_page: response.pagination?.current_page || (params.page || 1),
      total_pages: response.pagination?.total_pages || Math.ceil((response.pagination?.count || 0) / (limit || 10)),
    };

    return {
      data: Array.isArray(response.data) ? response.data : [],
      pagination,
    };
  }

  async getById(id: number | string): Promise<EmailMessage> {
    const response = await api.get<EmailMessage>(
      `${this.baseUrl}${id}/`
    );

    return response.data;
  }

  async create(data: EmailMessageCreate): Promise<EmailMessage> {
    const response = await api.post<EmailMessage>(
      this.baseUrl,
      data as unknown as Record<string, unknown>
    );

    return response.data;
  }

  async update(id: number | string, data: EmailMessageUpdate): Promise<EmailMessage> {
    const response = await api.patch<EmailMessage>(
      `${this.baseUrl}${id}/`,
      data as unknown as Record<string, unknown>
    );

    return response.data;
  }

  async delete(id: number | string): Promise<void> {
    await api.delete<void>(
      `${this.baseUrl}${id}/`
    );
  }

  async markAsRead(id: number | string): Promise<EmailMessage> {
    const response = await api.post<EmailMessage>(
      `${this.baseUrl}${id}/mark_as_read/`
    );

    return response.data;
  }

  async markAsReplied(id: number | string, replyMessage: string): Promise<EmailMessage> {
    const response = await api.post<EmailMessage>(
      `${this.baseUrl}${id}/mark_as_replied/`,
      { reply_message: replyMessage }
    );

    return response.data;
  }

  async toggleStar(id: number | string): Promise<EmailMessage> {
    const response = await api.post<EmailMessage>(
      `${this.baseUrl}${id}/toggle_star/`
    );

    return response.data;
  }

  async getStats(): Promise<EmailStats> {
    const response = await api.get<EmailStats>(
      `${this.baseUrl}/stats/`
    );

    return response.data;
  }

  async saveDraft(data: EmailMessageCreate): Promise<EmailMessage> {
    const draftData = {
      ...data,
      status: 'draft' as const,
    };
    return this.create(draftData);
  }

  async updateDraft(id: number | string, data: EmailMessageUpdate): Promise<EmailMessage> {
    const draftData = {
      ...data,
      status: 'draft' as const,
    };
    return this.update(id, draftData);
  }
}

export const emailApi = new EmailApi();

