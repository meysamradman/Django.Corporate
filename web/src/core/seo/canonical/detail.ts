import { permanentRedirect } from "next/navigation";

type CanonicalEntity = {
  id?: string | number | null;
  public_id?: string | null;
  slug?: string | null;
};

const normalizeSlug = (value: string | null | undefined): string =>
  decodeURIComponent(String(value || "")).trim().toLowerCase();

export const resolveCanonicalEntityId = (entity: CanonicalEntity): string | number => {
  const rawId = entity.id;

  if (typeof rawId === "number" && Number.isFinite(rawId)) {
    return rawId;
  }

  if (typeof rawId === "string" && rawId.trim()) {
    return rawId.trim();
  }

  return String(entity.public_id || "").trim();
};

export const buildCanonicalDetailPath = ({
  basePath,
  id,
  slug,
}: {
  basePath: string;
  id: string | number;
  slug: string;
}): string => {
  const normalizedBase = `/${String(basePath || "").replace(/^\/+|\/+$/g, "")}`;
  return `${normalizedBase}/${id}/${encodeURIComponent(slug)}`;
};

export const redirectToCanonicalDetail = ({
  basePath,
  entity,
}: {
  basePath: string;
  entity: CanonicalEntity;
}): never => {
  const canonicalId = resolveCanonicalEntityId(entity);
  const canonicalSlug = String(entity.slug || "").trim();
  permanentRedirect(buildCanonicalDetailPath({ basePath, id: canonicalId, slug: canonicalSlug }));
};

export const ensureCanonicalDetailRedirect = ({
  basePath,
  routeId,
  routeSlug,
  entity,
}: {
  basePath: string;
  routeId: string;
  routeSlug?: string;
  entity: CanonicalEntity;
}): void => {
  const canonicalId = resolveCanonicalEntityId(entity);
  const canonicalSlug = String(entity.slug || "").trim();

  const idMismatch = String(canonicalId) !== String(routeId);
  if (idMismatch) {
    permanentRedirect(buildCanonicalDetailPath({ basePath, id: canonicalId, slug: canonicalSlug }));
  }

  if (routeSlug !== undefined) {
    const routeNormalizedSlug = normalizeSlug(routeSlug);
    const canonicalNormalizedSlug = normalizeSlug(canonicalSlug);

    if (!canonicalNormalizedSlug || routeNormalizedSlug !== canonicalNormalizedSlug) {
      permanentRedirect(buildCanonicalDetailPath({ basePath, id: canonicalId, slug: canonicalSlug }));
    }
  }
};
