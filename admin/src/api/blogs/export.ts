import { fetchApi } from "@/core/config/fetch";
import { BlogListParams } from "@/types/blog/blogListParams";

/**
 * Extended params for export (includes export_all flag)
 */
interface ExportParams extends BlogListParams {
  export_all?: boolean;
}

/**
 * Export API functions for blogs
 * Separated from main route.ts for better organization
 */

/**
 * Export single blog to PDF
 */
export const exportBlogPdf = async (blogId: number): Promise<void> => {
  const url = `/admin/blog/${blogId}/export-pdf/`;
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `blog_${blogId}_${timestamp}.pdf`;
  
  await fetchApi.downloadFile(url, filename);
};

/**
 * Export blogs to Excel or PDF
 * @param filters - Blog filters and pagination
 * @param format - Export format: 'excel' or 'pdf'
 */
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
  
  // اگر export_all=true باشد، از fetch استفاده کن تا error message را بگیریم
  // در غیر این صورت از iframe برای سرعت بیشتر
  const useFetchForErrorHandling = filters?.export_all === true;
  
  await fetchApi.downloadFile(url, filename, 'GET', null, { 
    useFetchForErrorHandling 
  } as any);
};

