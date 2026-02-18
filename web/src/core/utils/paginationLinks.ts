export const DEFAULT_MAX_VISIBLE_PAGES = 5;

export const getVisiblePages = (
  currentPage: number,
  totalPages: number,
  maxVisiblePages: number = DEFAULT_MAX_VISIBLE_PAGES
): number[] => {
  if (totalPages <= maxVisiblePages) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const half = Math.floor(maxVisiblePages / 2);
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + maxVisiblePages - 1);

  if (end - start + 1 < maxVisiblePages) {
    start = Math.max(1, end - maxVisiblePages + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

export const buildPaginationItems = (
  currentPage: number,
  totalPages: number
): Array<number | "ellipsis"> => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  const validPages = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const result: Array<number | "ellipsis"> = [];
  for (let index = 0; index < validPages.length; index += 1) {
    const page = validPages[index];
    const previous = validPages[index - 1];
    if (previous && page - previous > 1) result.push("ellipsis");
    result.push(page);
  }

  return result;
};
