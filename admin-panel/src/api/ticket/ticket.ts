import { api } from '@/core/config/api';
import { ApiError } from '@/types/api/apiError';
import type { PaginatedResponse, ApiPagination } from "@/types/shared/pagination";
import { convertToLimitOffset } from '@/components/shared/paginations/pagination';
import type {
  Ticket,
  TicketMessage,
  TicketCreate,
  TicketUpdate,
  TicketMessageCreate,
  TicketListParams,
} from "@/types/ticket/ticket";

class TicketApi {
  private baseUrl = '/admin/tickets/';
  private messageBaseUrl = '/admin/ticket-messages/';

  private ensureSuccess<T>(response: { metaData?: { status?: string; message?: string; AppStatusCode?: number }; errors?: Record<string, string[]> | null; data: T }): T {
    if (response.metaData?.status === 'success') {
      return response.data;
    }

    throw new ApiError({
      response: {
        AppStatusCode: response.metaData?.AppStatusCode || 400,
        _data: response,
        ok: false,
        message: response.metaData?.message || 'Operation failed',
        errors: response.errors || null,
      },
    });
  }

  async getList(params: TicketListParams = {}): Promise<PaginatedResponse<Ticket>> {
    const { limit, offset } = convertToLimitOffset(params.page || 1, params.size || 10);

    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (limit) queryParams.append('limit', limit.toString());
    if (offset) queryParams.append('offset', offset.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.priority) queryParams.append('priority', params.priority);
    if (params.assigned_to_me) queryParams.append('assigned_to_me', 'true');
    if (params.unassigned) queryParams.append('unassigned', 'true');
    if (params.order_by) {
      queryParams.append('ordering', params.order_desc ? `-${params.order_by}` : params.order_by);
    }

    const baseUrlWithQuery = this.baseUrl.endsWith('/')
      ? `${this.baseUrl}?${queryParams.toString()}`
      : `${this.baseUrl}/?${queryParams.toString()}`;

    const response = await api.get<Ticket[]>(baseUrlWithQuery);
    const data = this.ensureSuccess(response);

    const pagination: ApiPagination = {
      count: response.pagination?.count || (Array.isArray(response.data) ? response.data.length : 0),
      next: response.pagination?.next || null,
      previous: response.pagination?.previous || null,
      page_size: response.pagination?.page_size || limit || 10,
      current_page: response.pagination?.current_page || (params.page || 1),
      total_pages: response.pagination?.total_pages || Math.ceil((response.pagination?.count || 0) / (limit || 10)),
    };

    return {
      data: Array.isArray(data) ? data : [],
      pagination,
    };
  }

  async getById(id: number | string): Promise<Ticket> {
    const response = await api.get<Ticket>(
      `${this.baseUrl}${id}/`
    );
    return this.ensureSuccess(response);
  }

  async create(data: TicketCreate): Promise<Ticket> {
    const response = await api.post<Ticket>(
      `${this.baseUrl}`,
      data as unknown as Record<string, unknown>
    );
    return this.ensureSuccess(response);
  }

  async update(id: number | string, data: TicketUpdate): Promise<Ticket> {
    const response = await api.put<Ticket>(
      `${this.baseUrl}${id}/`,
      data as unknown as Record<string, unknown>
    );
    return this.ensureSuccess(response);
  }

  async delete(id: number | string): Promise<void> {
    const response = await api.delete<void>(
      `${this.baseUrl}${id}/`
    );
    this.ensureSuccess(response);
  }

  async assign(id: number | string, adminId: number | null): Promise<Ticket> {
    const response = await api.post<Ticket>(
      `${this.baseUrl}${id}/assign/`,
      { admin_id: adminId } as unknown as Record<string, unknown>
    );
    return this.ensureSuccess(response);
  }

  async updateStatus(id: number | string, status: Ticket['status']): Promise<Ticket> {
    const response = await api.post<Ticket>(
      `${this.baseUrl}${id}/update_status/`,
      { status } as unknown as Record<string, unknown>
    );
    return this.ensureSuccess(response);
  }

  async getMessages(ticketId: number | string): Promise<TicketMessage[]> {
    const response = await api.get<TicketMessage[]>(
      `${this.messageBaseUrl}?ticket_id=${ticketId}`
    );
    const data = this.ensureSuccess(response);
    return Array.isArray(data) ? data : [];
  }

  async createMessage(data: TicketMessageCreate): Promise<TicketMessage> {
    const response = await api.post<TicketMessage>(
      `${this.messageBaseUrl}`,
      data as unknown as Record<string, unknown>
    );
    return this.ensureSuccess(response);
  }

  async markMessageRead(messageId: number | string): Promise<TicketMessage> {
    const response = await api.post<TicketMessage>(
      `${this.messageBaseUrl}${messageId}/mark_read/`
    );
    return this.ensureSuccess(response);
  }

  async markTicketAsRead(ticketId: number | string): Promise<Ticket> {
    const response = await api.post<Ticket>(
      `${this.baseUrl}${ticketId}/mark_as_read/`
    );
    return this.ensureSuccess(response);
  }
}

export const ticketApi = new TicketApi();

