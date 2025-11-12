import { fetchApi } from "@/core/config/fetch";
import { PaginatedResponse, ApiPagination } from "@/types/shared/pagination";
import { convertToLimitOffset } from '@/core/utils/pagination';

export interface EmailMessage {
  id: number;
  public_id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived' | 'draft';
  status_display: string;
  source: 'website' | 'mobile_app' | 'email' | 'api';
  source_display: string;
  ip_address?: string | null;
  user_agent?: string | null;
  reply_message?: string | null;
  replied_at?: string | null;
  replied_by?: number | null;
  read_at?: string | null;
  attachments: EmailAttachment[];
  has_attachments: boolean;
  is_new: boolean;
  is_replied: boolean;
  is_draft?: boolean;
  is_starred?: boolean;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface EmailAttachment {
  id: number;
  filename: string;
  file: string;
  file_size: number;
  file_size_formatted: string;
  content_type: string;
  created_at: string;
}

export interface EmailMessageCreate {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  source?: 'website' | 'mobile_app' | 'email' | 'api';
  status?: 'new' | 'draft';
}

export interface EmailMessageUpdate {
  status?: 'new' | 'read' | 'replied' | 'archived' | 'draft';
  reply_message?: string;
  subject?: string;
  message?: string;
  email?: string;
  name?: string;
}

export interface EmailListParams {
  search?: string;
  page?: number;
  size?: number;
  order_by?: string;
  order_desc?: boolean;
  status?: string;
  source?: string;
}

export interface EmailFilters {
  status?: string;
  source?: string;
}

export interface EmailStats {
  total: number;
  new: number;
  read: number;
  replied: number;
  archived: number;
  draft: number;
}

interface BackendPagination {
  count?: number;
  next?: string | null;
  previous?: string | null;
  page_size?: number;
  current_page?: number;
  total_pages?: number;
}

interface BackendResponse<T> {
  metaData: {
    status: string;
    message: string;
    AppStatusCode: number;
    timestamp: string;
  };
  pagination?: BackendPagination;
  data: T;
}

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
    
    const response = await fetchApi.get<BackendResponse<EmailMessage[]>>(baseUrlWithQuery);

    if (response.metaData.status !== 'success') {
      throw new Error(response.metaData.message || 'خطا در دریافت لیست پیام‌ها');
    }

    const responseData = response.data as BackendResponse<EmailMessage[]>;
    const pagination: ApiPagination = {
      count: response.pagination?.count || (Array.isArray(responseData.data) ? responseData.data.length : 0),
      next: response.pagination?.next || null,
      previous: response.pagination?.previous || null,
      page_size: response.pagination?.page_size || limit || 10,
      current_page: response.pagination?.current_page || (params.page || 1),
      total_pages: response.pagination?.total_pages || 1,
    };

    return {
      data: Array.isArray(responseData.data) ? responseData.data : [],
      pagination,
    };
  }

  async getById(id: number | string): Promise<EmailMessage> {
    const response = await fetchApi.get<BackendResponse<EmailMessage>>(
      `${this.baseUrl}/${id}/`
    );

    if (response.metaData.status !== 'success') {
      throw new Error(response.metaData.message || 'خطا در دریافت پیام');
    }

    const responseData = response.data as BackendResponse<EmailMessage>;
    return responseData.data;
  }

  async create(data: EmailMessageCreate): Promise<EmailMessage> {
    const response = await fetchApi.post<BackendResponse<EmailMessage>>(
      `${this.baseUrl}/`,
      data as unknown as Record<string, unknown>
    );

    if (response.metaData.status !== 'success') {
      throw new Error(response.metaData.message || 'خطا در ایجاد پیام');
    }

    const responseData = response.data as BackendResponse<EmailMessage>;
    return responseData.data;
  }

  async update(id: number | string, data: EmailMessageUpdate): Promise<EmailMessage> {
    const response = await fetchApi.patch<BackendResponse<EmailMessage>>(
      `${this.baseUrl}/${id}/`,
      data as unknown as Record<string, unknown>
    );

    if (response.metaData.status !== 'success') {
      throw new Error(response.metaData.message || 'خطا در به‌روزرسانی پیام');
    }

    const responseData = response.data as BackendResponse<EmailMessage>;
    return responseData.data;
  }

  async delete(id: number | string): Promise<void> {
    const response = await fetchApi.delete<BackendResponse<void>>(
      `${this.baseUrl}/${id}/`
    );

    if (response.metaData.status !== 'success') {
      throw new Error(response.metaData.message || 'خطا در حذف پیام');
    }
  }

  async markAsRead(id: number | string): Promise<EmailMessage> {
    const response = await fetchApi.post<BackendResponse<EmailMessage>>(
      `${this.baseUrl}/${id}/mark_as_read/`
    );

    if (response.metaData.status !== 'success') {
      throw new Error(response.metaData.message || 'خطا در علامت‌گذاری پیام');
    }

    const responseData = response.data as BackendResponse<EmailMessage>;
    return responseData.data;
  }

  async markAsReplied(id: number | string): Promise<EmailMessage> {
    const response = await fetchApi.post<BackendResponse<EmailMessage>>(
      `${this.baseUrl}/${id}/mark_as_replied/`
    );

    if (response.metaData.status !== 'success') {
      throw new Error(response.metaData.message || 'خطا در علامت‌گذاری پیام');
    }

    const responseData = response.data as BackendResponse<EmailMessage>;
    return responseData.data;
  }

  async toggleStar(id: number | string): Promise<EmailMessage> {
    const response = await fetchApi.post<BackendResponse<EmailMessage>>(
      `${this.baseUrl}/${id}/toggle_star/`
    );

    if (response.metaData.status !== 'success') {
      throw new Error(response.metaData.message || 'خطا در ستاره‌دار کردن پیام');
    }

    const responseData = response.data as BackendResponse<EmailMessage>;
    return responseData.data;
  }

  async getStats(): Promise<EmailStats> {
    const response = await fetchApi.get<BackendResponse<EmailStats>>(
      `${this.baseUrl}/stats/`
    );

    if (response.metaData.status !== 'success') {
      throw new Error(response.metaData.message || 'خطا در دریافت آمار');
    }

    const responseData = response.data as BackendResponse<EmailStats>;
    return responseData.data;
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

