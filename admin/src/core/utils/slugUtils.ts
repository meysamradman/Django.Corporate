/**
 * Utility function to generate a URL-friendly slug from a string
 * Supports Persian characters and other Unicode characters
 * 
 * @param text - The input text to convert to a slug
 * @returns A formatted slug string
 */
export const generateSlug = (text: string): string => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF\s-]/g, '') // Allow Persian characters and word characters
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/-+/g, '-') // Replace multiple - with single -
    .replace(/^-+|-+$/g, '') // Trim - from start and end
    .substring(0, 60); // Ensure it doesn't exceed max length
};

/**
 * Utility function to format a slug as the user types
 * This is the same as generateSlug but with a more descriptive name
 * to indicate its use case
 * 
 * @param text - The input text to format
 * @returns A formatted slug string
 */
export const formatSlug = (text: string): string => {
  return generateSlug(text);
};