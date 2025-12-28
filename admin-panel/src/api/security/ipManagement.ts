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
  // دریافت لیست IPهای ban شده
  getBannedIPs: async (): Promise<BannedIP[]> => {
    const response = await api.get<BannedIP[]>('/admin/ip-management/banned_ips/');
    return response.data || [];
  },

  // رفع ban یک IP
  unbanIP: async (ip: string): Promise<void> => {
    await api.post('/admin/ip-management/unban_ip/', { ip });
  },

  // Ban کردن یک IP دستی
  banIP: async (ip: string, reason?: string): Promise<void> => {
    await api.post('/admin/ip-management/ban_ip/', { ip, reason });
  },

  // دریافت اطلاعات یک IP
  getIPInfo: async (ip: string): Promise<IPInfo> => {
    const response = await api.get<IPInfo>(`/admin/ip-management/attempts/?ip=${ip}`);
    return response.data!;
  },

  // دریافت لیست IPهای whitelist
  getWhitelist: async (): Promise<string[]> => {
    const response = await api.get<string[]>('/admin/ip-management/whitelist/');
    return response.data || [];
  },

  // اضافه کردن IP به whitelist
  addToWhitelist: async (ip: string): Promise<void> => {
    await api.post('/admin/ip-management/add_to_whitelist/', { ip });
  },

  // حذف IP از whitelist
  removeFromWhitelist: async (ip: string): Promise<void> => {
    await api.post('/admin/ip-management/remove_from_whitelist/', { ip });
  },

  // اضافه کردن IP فعلی به whitelist
  addCurrentIPToWhitelist: async (): Promise<void> => {
    await api.post('/admin/ip-management/add_current_ip_to_whitelist/', {});
  },

  // دریافت IP فعلی
  getCurrentIP: async (): Promise<IPInfo> => {
    const response = await api.get<IPInfo>('/admin/ip-management/current_ip/');
    return response.data!;
  },
};

