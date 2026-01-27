/**
 * Portfolio Print View Hook
 */

import { useNavigate } from 'react-router-dom';

export function usePortfolioPrintView() {
    const navigate = useNavigate();

    const openPrintWindow = (portfolioIds: number[]) => {
        if (portfolioIds.length === 0) return;

        const url = `/portfolios/print?ids=${portfolioIds.join(',')}`;
        const windowFeatures = 'width=1024,height=768,menubar=no,toolbar=no,location=no,status=no';

        window.open(url, '_blank', windowFeatures);
    };

    const navigateToPrint = (portfolioIds: number[]) => {
        if (portfolioIds.length === 0) return;
        navigate(`/portfolios/print?ids=${portfolioIds.join(',')}`);
    };

    return {
        openPrintWindow,
        navigateToPrint,
    };
}
