export type TicketStatusType = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriorityType = 'low' | 'medium' | 'high' | 'urgent';

export interface TicketStatusItem {
  id: TicketStatusType | 'all';
  label: string;
  count?: number;
  unreadCount?: number;
}

export interface TicketPriorityItem {
  id: TicketPriorityType;
  label: string;
  color?: string;
}

