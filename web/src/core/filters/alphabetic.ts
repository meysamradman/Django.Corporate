/**
 * Filter non-alphabetic characters from string (Persian and English)
 */
export const filterAlphabeticOnly = (value: string): string => {
    return value.replace(/[^a-zA-Zآ-ی\s]/g, '');
};
