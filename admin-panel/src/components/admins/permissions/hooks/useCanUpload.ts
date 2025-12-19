import { usePermission } from '../context/PermissionContext';

export function useCanUpload(context: 'portfolio' | 'blog' | 'media_library' = 'media_library'): boolean {
  const { canUploadInContext } = usePermission();
  return canUploadInContext(context);
}

