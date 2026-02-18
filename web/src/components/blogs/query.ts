export const BLOGS_PAGE_SIZE = 9;

type SearchParams = Record<string, string | string[] | undefined>;

const toSingle = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
};

export const resolveBlogListQuery = (searchParams: SearchParams): { page: number; search?: string } => {
  const pageRaw = Number(toSingle(searchParams.page));
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  const searchRaw = toSingle(searchParams.search).trim();
  const search = searchRaw || undefined;

  return { page, search };
};

export const toBlogListApiParams = ({ page, search }: { page: number; search?: string }) => ({
  page,
  size: BLOGS_PAGE_SIZE,
  search,
  ordering: "-created_at",
});

export const buildBlogListHref = ({ page, search }: { page: number; search?: string }): string => {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `/blogs?${query}` : "/blogs";
};
