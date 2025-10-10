/**
 * Converts page/size pagination parameters to limit/offset parameters
 * for Django REST Framework APIs
 * 
 * @param page - Page number (1-based)
 * @param size - Page size
 * @returns Object with limit and offset properties
 */
export function convertToLimitOffset(page: number, size: number): { limit: number; offset: number } {
  const limit = size;
  const offset = (page - 1) * size;
  return { limit, offset };
}

/**
 * Converts limit/offset pagination parameters to page/size parameters
 * 
 * @param limit - Limit (page size)
 * @param offset - Offset
 * @returns Object with page and size properties
 */
export function convertToPageSize(limit: number, offset: number): { page: number; size: number } {
  const size = limit;
  const page = offset / limit + 1;
  return { page, size };
}

/**
 * Validates and normalizes pagination parameters
 * 
 * @param params - Pagination parameters object
 * @param defaultSize - Default page size if not provided
 * @param validSizes - Array of valid page sizes
 * @returns Normalized pagination parameters
 */
export function normalizePaginationParams(
  params: { page?: number; size?: number },
  defaultSize: number,
  validSizes: number[]
): { page: number; size: number } {
  let page = params.page ?? 1;
  let size = params.size ?? defaultSize;
  
  // Validate page number
  if (typeof page !== 'number' || !Number.isInteger(page) || page < 1) {
    console.warn(`Invalid page number ${page}, defaulting to 1.`);
    page = 1;
  }
  
  // Validate page size
  if (typeof size !== 'number' || !Number.isInteger(size) || size < 1) {
    console.warn(`Invalid page size ${size}, defaulting to ${defaultSize}.`);
    size = defaultSize;
  }
  
  // Check if size is in valid sizes
  if (!validSizes.includes(size)) {
    console.warn(`Page size ${size} not in valid sizes, defaulting to ${defaultSize}.`);
    size = defaultSize;
  }
  
  return { page, size };
}