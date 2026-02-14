import { api } from '@/core/config/api';
import { extractData } from './shared';

export const floorPlansApi = {
  getFloorPlans: async (propertyId?: number): Promise<any[]> => {
    let url = '/admin/floor-plan/';
    if (propertyId) url += '?property_id=' + propertyId;
    const response = await api.get<any>(url);
    const data = extractData<any>(response);
    return Array.isArray(data) ? data : [];
  },

  getFloorPlanById: async (id: number): Promise<any> => {
    const response = await api.get<any>('/admin/floor-plan/' + id + '/');
    return extractData<any>(response);
  },

  createFloorPlan: async (data: any): Promise<any> => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'image_files' && key !== 'image_ids') {
        if (typeof value === 'object' && !(value instanceof File)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    if (Array.isArray(data.image_files)) {
      data.image_files.forEach((file: File) => formData.append('image_files', file));
    }

    if (Array.isArray(data.image_ids) && data.image_ids.length > 0) {
      formData.append('image_ids', data.image_ids.join(','));
    }

    const response = await api.post<any>('/admin/floor-plan/', formData);
    return extractData<any>(response);
  },

  updateFloorPlan: async (id: number, data: any): Promise<any> => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'image_files' && key !== 'image_ids') {
        if (typeof value === 'object' && !(value instanceof File)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    if (Array.isArray(data.image_files)) {
      data.image_files.forEach((file: File) => formData.append('image_files', file));
    }

    if (Array.isArray(data.image_ids)) {
      formData.append('image_ids', data.image_ids.join(','));
    }

    const response = await api.patch<any>('/admin/floor-plan/' + id + '/', formData);
    return extractData<any>(response);
  },

  deleteFloorPlan: async (id: number): Promise<void> => {
    await api.delete('/admin/floor-plan/' + id + '/');
  },

  addFloorPlanImages: async (floorPlanId: number, imageFiles: File[], imageIds?: number[]): Promise<any> => {
    const formData = new FormData();
    imageFiles.forEach((file) => formData.append('image_files', file));
    if (imageIds?.length) {
      formData.append('image_ids', imageIds.join(','));
    }
    const response = await api.post<any>('/admin/floor-plan/' + floorPlanId + '/add-images/', formData);
    return extractData<any>(response);
  },

  removeFloorPlanImage: async (floorPlanId: number, imageId: number): Promise<any> => {
    const response = await api.post<any>('/admin/floor-plan/' + floorPlanId + '/remove-image/', { image_id: imageId });
    return extractData<any>(response);
  },

  setFloorPlanMainImage: async (floorPlanId: number, imageId: number): Promise<any> => {
    const response = await api.post<any>('/admin/floor-plan/' + floorPlanId + '/set-main-image/', { image_id: imageId });
    return extractData<any>(response);
  },

  syncFloorPlanImages: async (floorPlanId: number, imageIds: number[], mainImageId?: number): Promise<any> => {
    const response = await api.post<any>('/admin/floor-plan/' + floorPlanId + '/sync-images/', {
      image_ids: imageIds,
      main_image_id: mainImageId,
    });
    return extractData<any>(response);
  },
};
