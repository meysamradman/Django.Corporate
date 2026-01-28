import { useCallback } from 'react';

/**
 * Hook to manage Property Print View lifecycle
 * Opens the dedicated print page with selected property IDs
 */
export const usePropertyPrintView = () => {
    const openPrintWindow = useCallback((ids: number[], type: 'list' | 'detail' = 'list') => {
        const idsParam = ids.join(',');
        const url = `/real-estate/print?ids=${idsParam}${type === 'detail' ? '&type=detail' : ''}`;

        window.open(url, '_blank', 'width=1024,height=768,menubar=no,toolbar=no,location=no,status=no');
    }, []);

    return { openPrintWindow };
};
