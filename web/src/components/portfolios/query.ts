export const PORTFOLIOS_PAGE_SIZE = 9;

type SearchParams = Record<string, string | string[] | undefined>;

const toSingle = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
};

export const resolvePortfolioListQuery = (searchParams: SearchParams): { page: number; search?: string } => {
  const pageRaw = Number(toSingle(searchParams.page));
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  const searchRaw = toSingle(searchParams.search).trim();
  const search = searchRaw || undefined;

  return { page, search };
};

export const toPortfolioListApiParams = ({ page, search }: { page: number; search?: string }) => ({
  page,
  size: PORTFOLIOS_PAGE_SIZE,
  search,
  order_by: "created_at",
  order_desc: true,
});

export const buildPortfolioListHref = ({ page, search }: { page: number; search?: string }): string => {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `/portfolios?${query}` : "/portfolios";
};
