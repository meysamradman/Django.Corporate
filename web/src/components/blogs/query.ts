export const BLOGS_PAGE_SIZE = 9;

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

export const resolveBlogListQuery = (
  searchParams: SearchParams
): { page: number; search?: string; category_slug?: string; tag_slug?: string } => {
  const pageRaw = Number(toSingle(searchParams.page));
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  const searchRaw = toSingle(searchParams.search).trim();
  const search = searchRaw || undefined;

  const category_slug = normalizeSlug(toSingle(searchParams.category_slug));

  const tag_slug = normalizeSlug(toSingle(searchParams.tag_slug));

  return { page, search, category_slug, tag_slug };
};

export const toBlogListApiParams = ({
  page,
  search,
  category_slug,
  tag_slug,
}: {
  page: number;
  search?: string;
  category_slug?: string;
  tag_slug?: string;
}) => ({
  page,
  size: BLOGS_PAGE_SIZE,
  search,
  category_slug: normalizeSlug(category_slug),
  tag_slug: normalizeSlug(tag_slug),
  ordering: "-created_at",
});

export const buildBlogListBasePath = ({
  category_slug,
  tag_slug,
}: {
  category_slug?: string;
  tag_slug?: string;
}): string => {
  const normalizedTag = normalizeSlug(tag_slug);
  const normalizedCategory = normalizeSlug(category_slug);

  if (normalizedTag) return `/blogs/tag/${encodeURIComponent(normalizedTag)}`;
  if (normalizedCategory) return `/blogs/category/${encodeURIComponent(normalizedCategory)}`;
  return "/blogs";
};

export const buildBlogListHref = ({
  page,
  search,
  category_slug,
  tag_slug,
}: {
  page: number;
  search?: string;
  category_slug?: string;
  tag_slug?: string;
}): string => {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  const basePath = buildBlogListBasePath({ category_slug, tag_slug });
  return query ? `${basePath}?${query}` : basePath;
};

export const buildBlogListAjaxHref = ({
  page,
  search,
  category_slug,
  tag_slug,
}: {
  page: number;
  search?: string;
  category_slug?: string;
  tag_slug?: string;
}): string => {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  const basePath = buildBlogListBasePath({ category_slug, tag_slug });
  return query ? `${basePath}?${query}` : basePath;
};
