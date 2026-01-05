export function convertToLimitOffset(page: number, size: number): { limit: number; offset: number } {
  const limit = size;
  const offset = (page - 1) * size;
  return { limit, offset };
}

export function convertToPageSize(limit: number, offset: number): { page: number; size: number } {
  const size = limit;
  const page = offset / limit + 1;
  return { page, size };
}

export function normalizePaginationParams(
  params: { page?: number; size?: number },
  defaultSize: number,
  validSizes: number[]
): { page: number; size: number } {
  let page = params.page ?? 1;
  let size = params.size ?? defaultSize;
  
  if (typeof page !== 'number' || !Number.isInteger(page) || page < 1) {
        page = 1;
  }
  
  if (typeof size !== 'number' || !Number.isInteger(size) || size < 1) {
        size = defaultSize;
  }
  
  if (!validSizes.includes(size)) {
        size = defaultSize;
  }
  
  return { page, size };
}