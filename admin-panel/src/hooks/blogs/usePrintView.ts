/**
 * Print View Hook
 * 
 * Handles opening print view in new window
 */

import { useNavigate } from 'react-router-dom';

export function usePrintView() {
    const navigate = useNavigate();

    /**
     * Open print view in new window
     */
    const openPrintWindow = (blogIds: number[]) => {
        if (blogIds.length === 0) {
            console.warn('No blogs selected for print');
            return;
        }

        const url = `/blogs/print?ids=${blogIds.join(',')}`;
        const windowFeatures = 'width=1024,height=768,menubar=no,toolbar=no,location=no,status=no';

        window.open(url, '_blank', windowFeatures);
    };

    /**
     * Navigate to print page (same window)
     */
    const navigateToPrint = (blogIds: number[]) => {
        if (blogIds.length === 0) {
            console.warn('No blogs selected for print');
            return;
        }

        navigate(`/blogs/print?ids=${blogIds.join(',')}`);
    };

    return {
        openPrintWindow,
        navigateToPrint,
    };
}
