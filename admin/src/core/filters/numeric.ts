/**
 * Filter non-numeric characters from string
 */
export const filterNumericOnly = (value: string): string => {
    return value.replace(/[^0-9]/g, '');
};
