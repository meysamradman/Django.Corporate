const LOCAL_DEV_SITE_URL = "http://localhost:3000";

const normalizeUrl = (url: string): string => url.trim().replace(/\/$/, "");

const resolveFromEnv = (): string | null => {
  const direct = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (direct && direct.trim()) return normalizeUrl(direct);

  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercelUrl && vercelUrl.trim()) return normalizeUrl(`https://${vercelUrl}`);

  return null;
};

export const getSiteUrl = (): string => {
  const envSiteUrl = resolveFromEnv();
  if (envSiteUrl) return envSiteUrl;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Missing site URL. Set NEXT_PUBLIC_SITE_URL (or SITE_URL) in production environment."
    );
  }

  return LOCAL_DEV_SITE_URL;
};

export const toAbsoluteUrl = (path: string): string => {
  const siteUrl = getSiteUrl();
  if (!path) return `${siteUrl}/`;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
};
