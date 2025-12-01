import { api, ApiResponse } from '@/lib/fetch';

export interface Email {
  id: number;
  public_id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived' | 'draft';
  source: 'website' | 'mobile_app' | 'email' | 'api';
  ip_address?: string;
  user_agent?: string;
  reply_message?: string;
  replied_at?: string;
  replied_by?: number;
  created_by?: number;
  read_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailListParams {
  page?: number;
  limit?: number;
  offset?: number;
  search?: string;
  status?: string;
  source?: string;
}

export const emailsApi = {
  // Create email (public endpoint - for contact form)
  createEmail: async (data: Partial<Email>): Promise<ApiResponse<Email>> => {
    return api.post<Email>('/email/messages/', data);
  },
  
  // Note: List and detail endpoints require admin authentication
  // For testing, you can use admin endpoints if authenticated
  // GET /email/messages/ - requires email.read permission
  // GET /email/messages/{id}/ - requires email.read permission
};

