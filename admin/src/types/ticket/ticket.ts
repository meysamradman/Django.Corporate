export interface Ticket {
  id: number;
  public_id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  user?: {
    id: number;
    mobile?: string;
    email?: string;
    full_name?: string;
  } | null;
  assigned_admin?: {
    id: number;
    user: {
      id: number;
      username: string;
      email?: string;
    };
  } | null;
  last_replied_at?: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  messages_count?: number;
  unread_messages_count?: number;
  messages?: TicketMessage[];
}

export interface TicketMessage {
  id: number;
  public_id: string;
  ticket: number;
  message: string;
  sender_type: 'user' | 'admin';
  sender_user?: {
    id: number;
    mobile?: string;
    email?: string;
    full_name?: string;
  } | null;
  sender_admin?: {
    id: number;
    user: {
      id: number;
      username: string;
      email?: string;
    };
  } | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  attachments?: TicketAttachment[];
}

export interface TicketAttachment {
  id: number;
  public_id: string;
  ticket_message: number;
  image?: {
    id: number;
    public_id: string;
    file_url: string;
    title?: string;
  } | null;
  video?: {
    id: number;
    public_id: string;
    file_url: string;
    title?: string;
  } | null;
  audio?: {
    id: number;
    public_id: string;
    file_url: string;
    title?: string;
  } | null;
  document?: {
    id: number;
    public_id: string;
    file_url: string;
    title?: string;
  } | null;
  media?: {
    id: number;
    public_id: string;
    file_url: string;
    media_type: 'image' | 'video' | 'audio' | 'document';
    title?: string;
  } | null;
  media_type?: 'image' | 'video' | 'audio' | 'document';
  media_url?: string;
  created_at: string;
}

export interface TicketCreate {
  subject: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  message?: string;
  attachment_ids?: number[];
}

export interface TicketUpdate {
  subject?: string;
  description?: string;
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assigned_admin?: number | null;
}

export interface TicketMessageCreate {
  ticket: number;
  message: string;
  sender_type: 'user' | 'admin';
  attachment_ids?: number[];
}

export interface TicketListParams {
  page?: number;
  size?: number;
  search?: string;
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to_me?: boolean;
  unassigned?: boolean;
  order_by?: string;
  order_desc?: boolean;
}

export type TicketStatusType = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriorityType = 'low' | 'medium' | 'high' | 'urgent';

