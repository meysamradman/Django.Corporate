export const MAX_CLIENT_SIDE_ROWS = 5000;

export function shouldUseClientSideExport(rowCount: number): boolean {
    return rowCount <= MAX_CLIENT_SIDE_ROWS;
}