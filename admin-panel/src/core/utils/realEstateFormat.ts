/**
 * Formats a number for area display (e.g. 150 مترمربع)
 * Always uses English digits for font compatibility.
 */
export const formatArea = (area: number | undefined | null): string => {
    if (area === undefined || area === null) return '0 مترمربع';
    return `${area.toLocaleString('en-US')} مترمربع`;
};

/**
 * Formats a price into a readable Persian format (e.g. 2.5 میلیارد تومان)
 * Converts large numbers to millions/billions for cleaner UI.
 * Always uses English digits for font compatibility.
 */
export const formatPriceToPersian = (price: number | undefined | null, currency: string = 'تومان'): string => {
    if (price === undefined || price === null || price === 0) return 'توافقی';

    if (price >= 1_000_000_000) {
        const billions = price / 1_000_000_000;
        return `${billions.toLocaleString('en-US', { maximumFractionDigits: 2 })} میلیارد ${currency}`;
    }

    if (price >= 1_000_000) {
        const millions = price / 1_000_000;
        return `${millions.toLocaleString('en-US', { maximumFractionDigits: 2 })} میلیون ${currency}`;
    }

    return `${price.toLocaleString('en-US')} ${currency}`;
};
