export const generateSlug = (text: string): string => {
    if (!text) return '';
    
    return text
        .toLowerCase()
        .replace(/[^\w\u0600-\u06FF\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 60);
};

export const formatSlug = (text: string): string => {
    return generateSlug(text);
};
