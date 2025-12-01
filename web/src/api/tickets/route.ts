import { fetchApi } from '@/lib/fetch';

interface TicketCreateData {
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  message?: string;
}

class TicketsApi {
  private baseUrl = '/public/tickets';

  async createTicket(data: TicketCreateData) {
    return fetchApi(`${this.baseUrl}/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTicketByToken(token: string) {
    return fetchApi(`${this.baseUrl}/by-token/${token}/`);
  }

  async replyToTicket(token: string, message: string) {
    return fetchApi(`${this.baseUrl}/${token}/reply/`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }
}

export const ticketsApi = new TicketsApi();
