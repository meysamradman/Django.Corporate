/**
 * Portfolio Export Types
 */

export type PortfolioExportFormat = 'excel' | 'pdf';

export interface PortfolioExportOptions {
    selectedIds?: number[];
    filters?: Record<string, any>;
    exportAll?: boolean;
}

export interface PortfolioPrintViewOptions {
    portfolioIds: number[];
    title?: string;
}
