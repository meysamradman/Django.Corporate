export interface RecentTicket {
  id: number;
  public_id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
}

export interface TicketNotificationData {
  new_tickets_count: number;
  assigned_to_me_count: number;
  total_new: number;
  recent_tickets: RecentTicket[];
}

export interface EmailNotificationData {
  new: number;
  total: number;
}

export interface NotificationCounts {
  tickets: {
    new_count: number;
    assigned_to_me_count: number;
    total_new: number;
    recent_tickets: RecentTicket[];
  };
  emails: {
    new_count: number;
    total: number;
  };
  total: number;
}
