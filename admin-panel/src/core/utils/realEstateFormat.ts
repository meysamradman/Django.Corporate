/**
 * Formats a number for area display (e.g. ۱۵۰ مترمربع)
 * Uses Persian digits for local consistency.
 */
export const formatArea = (area: number | undefined | null): string => {
    if (area === undefined || area === null) return '۰ مترمربع';
    return `${area.toLocaleString('fa-IR')} مترمربع`;
};

/**
 * Formats a price into a readable Persian format (e.g. ۲.۵ میلیارد تومان)
 * Converts large numbers to millions/billions for cleaner UI.
 * Uses Persian digits for local consistency.
 */
export const formatPriceToPersian = (price: number | undefined | null, currency: string = 'تومان'): string => {
    if (price === undefined || price === null || price === 0) return 'توافقی';

    if (price >= 1_000_000_000) {
        const billions = price / 1_000_000_000;
        return `${billions.toLocaleString('fa-IR', { maximumFractionDigits: 2 })} میلیارد ${currency}`;
    }

    if (price >= 1_000_000) {
        const millions = price / 1_000_000;
        return `${millions.toLocaleString('fa-IR', { maximumFractionDigits: 2 })} میلیون ${currency}`;
    }

    return `${price.toLocaleString('fa-IR')} ${currency}`;
};
