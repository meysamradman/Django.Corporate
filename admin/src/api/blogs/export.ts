import { fetchApi } from "@/core/config/fetch";
import { BlogListParams } from "@/types/blog/blogListParams";

interface ExportParams extends BlogListParams {
  export_all?: boolean;
}

export const exportBlogPdf = async (blogId: number): Promise<void> => {
  const url = `/admin/blog/${blogId}/export-pdf/`;
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `blog_${blogId}_${timestamp}.pdf`;
  
  await fetchApi.downloadFile(url, filename);
};

export const exportBlogs = async (
  filters?: ExportParams, 
  format: 'excel' | 'pdf' = 'excel'
): Promise<void> => {
  let url = '/admin/blog/export/';
  if (filters || format) {
    const queryParams = new URLSearchParams();
    
    queryParams.append('format', format);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'is_featured' || key === 'is_public' || key === 'is_active') {
            if (typeof value === 'boolean') {
              queryParams.append(key, value.toString());
            } else if (typeof value === 'string') {
              queryParams.append(key, value);
            }
          } else if (key === 'categories__in') {
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
    ? `blogs_${timestamp}.pdf`
    : `blogs_${timestamp}.xlsx`;
  
  const useFetchForErrorHandling = filters?.export_all === true;
  
  await fetchApi.downloadFile(url, filename, 'GET', null, { 
    useFetchForErrorHandling 
  } as any);
};

