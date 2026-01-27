/**
 * Export Types
 * 
 * Type definitions for blog export functionality
 */

export type ExportFormat = 'excel' | 'pdf';

export interface ExportOptions {
    selectedIds?: number[];
    filters?: Record<string, any>;
    exportAll?: boolean;
}

export interface ExcelExportResult {
    success: boolean;
    filename?: string;
    error?: string;
}

export interface PrintViewOptions {
    blogIds: number[];
    title?: string;
}
