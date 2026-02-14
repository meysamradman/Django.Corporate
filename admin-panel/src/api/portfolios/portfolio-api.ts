import { api } from '@/core/config/api';
import type { Portfolio } from '@/types/portfolio/portfolio';
import type { PortfolioListParams } from '@/types/portfolio/portfolioListParams';
import { buildListUrl, toPaginatedResponse } from './shared';

const PORTFOLIO_BOOLEAN_FILTERS = new Set(['is_featured', 'is_public', 'is_active']);
const PORTFOLIO_RAW_STRING_FILTERS = new Set(['categories__in']);

const appendFormData = (formData: FormData, data: Partial<Portfolio> & { media_ids?: number[] }) => {
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null && key !== 'media_ids') {
      if (Array.isArray(value) || typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    }
  });
};

export const portfolioCoreApi = {
  getPortfolioList: async (params?: PortfolioListParams) => {
    const url = buildListUrl('/admin/portfolio/', params as any, {
      booleanKeys: PORTFOLIO_BOOLEAN_FILTERS,
      rawStringKeys: PORTFOLIO_RAW_STRING_FILTERS,
    });
    const response = await api.get<Portfolio[]>(url);
    return toPaginatedResponse<Portfolio>(response, params as any);
  },

  getPortfolioById: async (id: number): Promise<Portfolio> => {
    const response = await api.get<Portfolio>('/admin/portfolio/' + id + '/');
    return response.data;
  },

  getPortfoliosByIds: async (ids: number[]): Promise<Portfolio[]> => {
    if (ids.length === 0) return [];
    const response = await api.get<Portfolio[]>(`/admin/portfolio/?ids=${ids.join(',')}`);
    return Array.isArray(response.data) ? response.data : [];
  },

  createPortfolio: async (data: Partial<Portfolio>): Promise<Portfolio> => {
    const response = await api.post<Portfolio>('/admin/portfolio/', data);
    return response.data;
  },

  createPortfolioWithMedia: async (data: Partial<Portfolio> & { media_ids?: number[] }, mediaFiles: File[]): Promise<Portfolio> => {
    const formData = new FormData();
    appendFormData(formData, data);

    mediaFiles.forEach((file) => {
      formData.append('media_files', file);
    });

    if (data.media_ids && Array.isArray(data.media_ids) && data.media_ids.length > 0) {
      formData.append('media_ids', data.media_ids.join(','));
    }

    const response = await api.post<Portfolio>('/admin/portfolio/', formData);
    return response.data;
  },

  updatePortfolio: async (id: number, data: Partial<Portfolio>): Promise<Portfolio> => {
    const response = await api.put<Portfolio>('/admin/portfolio/' + id + '/', data);
    return response.data;
  },

  partialUpdatePortfolio: async (id: number, data: Partial<Portfolio>): Promise<Portfolio> => {
    const response = await api.patch<Portfolio>('/admin/portfolio/' + id + '/', data);
    return response.data;
  },

  addMediaToPortfolio: async (portfolioId: number, mediaFiles: File[], mediaIds?: number[]): Promise<Portfolio> => {
    const formData = new FormData();
    mediaFiles.forEach((file) => {
      formData.append('media_files', file);
    });

    if (mediaIds && mediaIds.length > 0) {
      formData.append('media_ids', mediaIds.join(','));
    }

    const response = await api.post<Portfolio>('/admin/portfolio/' + portfolioId + '/add_media/', formData);
    return response.data;
  },

  deletePortfolio: async (id: number): Promise<void> => {
    await api.delete('/admin/portfolio/' + id + '/');
  },

  bulkDeletePortfolios: async (ids: number[]): Promise<{ success: boolean }> => {
    const response = await api.post<{ success: boolean }>('/admin/portfolio/bulk-delete/', { ids });
    return response.data;
  },

  exportPortfolioPdf: async (portfolioId: number): Promise<void> => {
    const { exportPortfolioPdf } = await import('./export');
    return exportPortfolioPdf(portfolioId);
  },

  exportPortfolios: async (filters?: PortfolioListParams, format: 'excel' | 'pdf' = 'excel'): Promise<void> => {
    const { exportPortfolios } = await import('./export');
    return exportPortfolios(filters, format);
  },
};
