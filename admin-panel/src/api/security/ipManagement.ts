import { api } from '@/core/config/api';

export interface BannedIP {
  ip: string;
  reason: string;
  banned_at: string;
}

export interface IPInfo {
  ip: string;
  is_banned: boolean;
  is_whitelisted: boolean;
  attempts: number;
  max_attempts: number;
}

export const ipManagementApi = {
  getBannedIPs: async (): Promise<BannedIP[]> => {
    const response = await api.get<BannedIP[]>('/admin/ip-management/banned_ips/');
    return response.data || [];
  },

  unbanIP: async (ip: string): Promise<void> => {
    await api.post('/admin/ip-management/unban_ip/', { ip });
  },

  banIP: async (ip: string, reason?: string): Promise<void> => {
    await api.post('/admin/ip-management/ban_ip/', { ip, reason });
  },

  getIPInfo: async (ip: string): Promise<IPInfo> => {
    const response = await api.get<IPInfo>(`/admin/ip-management/attempts/?ip=${encodeURIComponent(ip)}`);
    return response.data!;
  },

  getWhitelist: async (): Promise<string[]> => {
    const response = await api.get<string[]>('/admin/ip-management/whitelist/');
    return response.data || [];
  },

  addToWhitelist: async (ip: string): Promise<void> => {
    await api.post('/admin/ip-management/add_to_whitelist/', { ip });
  },

  removeFromWhitelist: async (ip: string): Promise<void> => {
    await api.post('/admin/ip-management/remove_from_whitelist/', { ip });
  },

  addCurrentIPToWhitelist: async (): Promise<void> => {
    await api.post('/admin/ip-management/add_current_ip_to_whitelist/', {});
  },

  getCurrentIP: async (): Promise<IPInfo> => {
    const response = await api.get<IPInfo>('/admin/ip-management/current_ip/');
    return response.data!;
  },
};

