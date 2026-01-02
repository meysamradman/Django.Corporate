import { api } from '@/core/config/api';
import type { PropertyExportParams } from "@/types/real_estate/realEstateListParams";

export const exportPropertyPdf = async (propertyId: number): Promise<void> => {
  const url = `/admin/property/${propertyId}/export-pdf/`;
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `property_${propertyId}_${timestamp}.pdf`;
  
  await api.download(url, filename);
};

export const exportProperties = async (
  filters?: PropertyExportParams, 
  format: 'excel' | 'pdf' = 'excel'
): Promise<void> => {
  let url = '/admin/property/export/';
  if (filters || format) {
    const queryParams = new URLSearchParams();
    
    queryParams.append('format', format);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'is_published' || key === 'is_featured' || key === 'is_public' || key === 'is_active') {
            if (typeof value === 'boolean') {
              queryParams.append(key, value.toString());
            } else if (typeof value === 'string') {
              queryParams.append(key, value);
            }
          } else if (key === 'labels__in' || key === 'tags__in' || key === 'features__in') {
            queryParams.append(key, value as string);
          } else if (key === 'page' || key === 'size' || key === 'export_all') {
            queryParams.append(key, String(value));
          } else {
            queryParams.append(key, String(value));
          }
        }
      });
    }
    
    const queryString = queryParams.toString();
    if (queryString) {
      url += '?' + queryString;
    }
  }
  
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = format === 'pdf' 
    ? `properties_${timestamp}.pdf`
    : `properties_${timestamp}.xlsx`;
  
  await api.download(url, filename);
};

