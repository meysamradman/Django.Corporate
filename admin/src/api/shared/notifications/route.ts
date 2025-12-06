import { fetchApi } from '@/core/config/fetch';

export interface NotificationCounts {
  tickets: {
    new_count: number;
    assigned_to_me_count: number;
    total_new: number;
    recent_tickets: Array<{
      id: number;
      public_id: string;
      subject: string;
      status: string;
      priority: string;
      created_at: string;
    }>;
  };
  emails: {
    new_count: number;
    total: number;
  };
  total: number;
}

export const notificationsApi = {
  getNotificationCounts: async (): Promise<NotificationCounts> => {
    try {
      const [ticketsResponse, emailsResponse] = await Promise.allSettled([
        fetchApi.get<{
          new_tickets_count: number;
          assigned_to_me_count: number;
          total_new: number;
          recent_tickets: Array<{
            id: number;
            public_id: string;
            subject: string;
            status: string;
            priority: string;
            created_at: string;
          }>;
        }>('/admin/tickets/stats/'),
        fetchApi.get<{
          new: number;
          total: number;
        }>('/email/messages/stats/'),
      ]);

      const tickets = ticketsResponse.status === 'fulfilled' 
        ? ticketsResponse.value.data 
        : { new_tickets_count: 0, assigned_to_me_count: 0, total_new: 0, recent_tickets: [] };
      
      const emails = emailsResponse.status === 'fulfilled'
        ? emailsResponse.value.data
        : { new: 0, total: 0 };

      const total = (tickets.total_new || 0) + (emails.new || 0);

      return {
        tickets: {
          new_count: tickets.new_tickets_count || 0,
          assigned_to_me_count: tickets.assigned_to_me_count || 0,
          total_new: tickets.total_new || 0,
          recent_tickets: tickets.recent_tickets || [],
        },
        emails: {
          new_count: emails.new || 0,
          total: emails.total || 0,
        },
        total,
      };
    } catch (error) {
      return {
        tickets: {
          new_count: 0,
          assigned_to_me_count: 0,
          total_new: 0,
          recent_tickets: [],
        },
        emails: {
          new_count: 0,
          total: 0,
        },
        total: 0,
      };
    }
  },
};

