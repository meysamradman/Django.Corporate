import { api } from '@/core/config/api';
import type { PropertyAgent } from '@/types/real_estate/agent/realEstateAgent';
import type { RealEstateAgency } from '@/types/real_estate/agency/realEstateAgency';
import { fetchPaginated } from './shared';

export const agentsAgenciesApi = {
  getAgents: async (params?: { page?: number; size?: number; is_active?: boolean; is_verified?: boolean; show_in_team?: boolean; agency?: number; city?: number }) => {
    return fetchPaginated<PropertyAgent>('/admin/property-agent/', params);
  },
  createAgent: async (data: Partial<PropertyAgent>) => (await api.post<PropertyAgent>('/admin/property-agent/', data)).data,
  getAgentById: async (id: number) => (await api.get<PropertyAgent>('/admin/property-agent/' + id + '/')).data,
  updateAgent: async (id: number, data: Partial<PropertyAgent>) => (await api.put<PropertyAgent>('/admin/property-agent/' + id + '/', data)).data,
  partialUpdateAgent: async (id: number, data: Partial<PropertyAgent>) => (await api.patch<PropertyAgent>('/admin/property-agent/' + id + '/', data)).data,
  deleteAgent: async (id: number): Promise<void> => {
    await api.delete('/admin/property-agent/' + id + '/');
  },

  getAgencies: async (params?: { page?: number; size?: number; is_active?: boolean; is_verified?: boolean; city?: number }) => {
    return fetchPaginated<RealEstateAgency>('/admin/real-estate-agency/', params);
  },
  createAgency: async (data: Partial<RealEstateAgency>) => (await api.post<RealEstateAgency>('/admin/real-estate-agency/', data)).data,
  getAgencyById: async (id: number) => (await api.get<RealEstateAgency>('/admin/real-estate-agency/' + id + '/')).data,
  updateAgency: async (id: number, data: Partial<RealEstateAgency>) => (await api.put<RealEstateAgency>('/admin/real-estate-agency/' + id + '/', data)).data,
  partialUpdateAgency: async (id: number, data: Partial<RealEstateAgency>) => (await api.patch<RealEstateAgency>('/admin/real-estate-agency/' + id + '/', data)).data,
  deleteAgency: async (id: number): Promise<void> => {
    await api.delete('/admin/real-estate-agency/' + id + '/');
  },
};
