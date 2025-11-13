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

