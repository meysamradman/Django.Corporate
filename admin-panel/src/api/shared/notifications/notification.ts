import { api } from '@/core/config/api';
import type { TicketNotificationData, EmailNotificationData, NotificationCounts } from '@/types/shared/notifications';

export const notificationsApi = {
  getNotificationCounts: async (): Promise<NotificationCounts> => {
    try {
      const [ticketsResponse, emailsResponse] = await Promise.allSettled([
        api.get<TicketNotificationData>('/admin/tickets/stats/'),
        api.get<EmailNotificationData>('/email/messages/stats/'),
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
    } catch {
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

