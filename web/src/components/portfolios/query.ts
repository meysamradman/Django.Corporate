export const PORTFOLIOS_PAGE_SIZE = 9;

type SearchParams = Record<string, string | string[] | undefined>;

const toSingle = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
};

const looksPercentEncoded = (value: string): boolean => /%[0-9A-Fa-f]{2}/.test(value);

const safeDecodeURIComponent = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const normalizeSlug = (value?: string): string | undefined => {
  const trimmed = (value || "").trim();
  if (!trimmed) return undefined;
  if (!looksPercentEncoded(trimmed)) return trimmed;

  const decoded = safeDecodeURIComponent(trimmed).trim();
  return decoded || undefined;
};

export const resolvePortfolioListQuery = (
  searchParams: SearchParams
): { page: number; search?: string; category_slug?: string; tag_slug?: string; option_slug?: string } => {
  const pageRaw = Number(toSingle(searchParams.page));
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  const searchRaw = toSingle(searchParams.search).trim();
  const search = searchRaw || undefined;

  const category_slug = normalizeSlug(toSingle(searchParams.category_slug));

  const tag_slug = normalizeSlug(toSingle(searchParams.tag_slug));

  const option_slug = normalizeSlug(toSingle(searchParams.option_slug));

  return { page, search, category_slug, tag_slug, option_slug };
};

export const toPortfolioListApiParams = ({
  page,
  search,
  category_slug,
  tag_slug,
  option_slug,
}: {
  page: number;
  search?: string;
  category_slug?: string;
  tag_slug?: string;
  option_slug?: string;
}) => ({
  page,
  size: PORTFOLIOS_PAGE_SIZE,
  search,
  category_slug: normalizeSlug(category_slug),
  tag_slug: normalizeSlug(tag_slug),
  option_slug: normalizeSlug(option_slug),
  order_by: "created_at",
  order_desc: true,
});

export const buildPortfolioListBasePath = ({
  category_slug,
  tag_slug,
  option_slug,
}: {
  category_slug?: string;
  tag_slug?: string;
  option_slug?: string;
}): string => {
  const normalizedOption = normalizeSlug(option_slug);
  const normalizedTag = normalizeSlug(tag_slug);
  const normalizedCategory = normalizeSlug(category_slug);

  if (normalizedOption) return `/portfolios/option/${encodeURIComponent(normalizedOption)}`;
  if (normalizedTag) return `/portfolios/tag/${encodeURIComponent(normalizedTag)}`;
  if (normalizedCategory) return `/portfolios/category/${encodeURIComponent(normalizedCategory)}`;
  return "/portfolios";
};

export const buildPortfolioListHref = ({
  page,
  search,
  category_slug,
  tag_slug,
  option_slug,
}: {
  page: number;
  search?: string;
  category_slug?: string;
  tag_slug?: string;
  option_slug?: string;
}): string => {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  const basePath = buildPortfolioListBasePath({ category_slug, tag_slug, option_slug });
  return query ? `${basePath}?${query}` : basePath;
};

export const buildPortfolioListAjaxHref = ({
  page,
  search,
  category_slug,
  tag_slug,
  option_slug,
}: {
  page: number;
  search?: string;
  category_slug?: string;
  tag_slug?: string;
  option_slug?: string;
}): string => {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  const basePath = buildPortfolioListBasePath({ category_slug, tag_slug, option_slug });
  return query ? `${basePath}?${query}` : basePath;
};
