import { api } from '@/core/config/api';
import type { PaginatedResponse, ApiPagination } from "@/types/shared/pagination";
import { convertToLimitOffset } from '@/core/utils/pagination';
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

    if (response.metaData.status !== 'success') {
      throw new Error(response.metaData.message || 'Error fetching tickets');
    }

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

  async getById(id: number | string): Promise<Ticket> {
    const response = await api.get<Ticket>(
      `${this.baseUrl}${id}/`
    );

    if (response.metaData.status !== 'success') {
      throw new Error(response.metaData.message || 'Error fetching ticket');
    }

    return response.data;
  }

  async create(data: TicketCreate): Promise<Ticket> {
    const response = await api.post<Ticket>(
      `${this.baseUrl}`,
      data as unknown as Record<string, unknown>
    );

    if (response.metaData.status !== 'success') {
      throw new Error(response.metaData.message || 'Error creating ticket');
    }

    return response.data;
  }

  async update(id: number | string, data: TicketUpdate): Promise<Ticket> {
    const response = await api.put<Ticket>(
      `${this.baseUrl}${id}/`,
      data as unknown as Record<string, unknown>
    );

    if (response.metaData.status !== 'success') {
      throw new Error(response.metaData.message || 'Error updating ticket');
    }

    return response.data;
  }

  async delete(id: number | string): Promise<void> {
    const response = await api.delete<void>(
      `${this.baseUrl}${id}/`
    );

    if (response.metaData.status !== 'success') {
      throw new Error(response.metaData.message || 'Error deleting ticket');
    }
  }

  async assign(id: number | string, adminId: number | null): Promise<Ticket> {
    const response = await api.post<Ticket>(
      `${this.baseUrl}${id}/assign/`,
      { admin_id: adminId } as unknown as Record<string, unknown>
    );

    if (response.metaData.status !== 'success') {
      throw new Error(response.metaData.message || 'Error assigning ticket');
    }

    return response.data;
  }

  async updateStatus(id: number | string, status: Ticket['status']): Promise<Ticket> {
    const response = await api.post<Ticket>(
      `${this.baseUrl}${id}/update_status/`,
      { status } as unknown as Record<string, unknown>
    );

    if (response.metaData.status !== 'success') {
      throw new Error(response.metaData.message || 'Error updating ticket status');
    }

    return response.data;
  }

  async getMessages(ticketId: number | string): Promise<TicketMessage[]> {
    const response = await api.get<TicketMessage[]>(
      `${this.messageBaseUrl}?ticket_id=${ticketId}`
    );

    if (response.metaData.status !== 'success') {
      throw new Error(response.metaData.message || 'Error fetching messages');
    }

    return Array.isArray(response.data) ? response.data : [];
  }

  async createMessage(data: TicketMessageCreate): Promise<TicketMessage> {
    const response = await api.post<TicketMessage>(
      `${this.messageBaseUrl}`,
      data as unknown as Record<string, unknown>
    );

    if (response.metaData.status !== 'success') {
      throw new Error(response.metaData.message || 'Error creating message');
    }

    return response.data;
  }

  async markMessageRead(messageId: number | string): Promise<TicketMessage> {
    const response = await api.post<TicketMessage>(
      `${this.messageBaseUrl}${messageId}/mark_read/`
    );

    if (response.metaData.status !== 'success') {
      throw new Error(response.metaData.message || 'Error marking message as read');
    }

    return response.data;
  }

  async markTicketAsRead(ticketId: number | string): Promise<Ticket> {
    const response = await api.post<Ticket>(
      `${this.baseUrl}${ticketId}/mark_as_read/`
    );

    if (response.metaData.status !== 'success') {
      throw new Error(response.metaData.message || 'Error marking ticket as read');
    }

    return response.data;
  }
}

export const ticketApi = new TicketApi();

