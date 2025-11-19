'use client';

import { usePermission } from '../context/PermissionContext';

/**
 * ✅ Context-aware upload permission check
 * @param context - 'portfolio' | 'blog' | 'media_library'
 * @returns boolean indicating if user can upload in this context
 * 
 * @example
 * // In portfolio form
 * const canUpload = useCanUpload('portfolio');
 * 
 * // In blog form
 * const canUpload = useCanUpload('blog');
 * 
 * // In media library
 * const canUpload = useCanUpload('media_library');
 */
export function useCanUpload(context: 'portfolio' | 'blog' | 'media_library' = 'media_library'): boolean {
  const { canUploadInContext } = usePermission();
  return canUploadInContext(context);
}

