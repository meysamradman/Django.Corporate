import { BedDouble, Bath } from "lucide-react";
import type { ReactNode } from "react";

import type { Property } from "@/types/real-estate/property";

export const getPropertyCanonicalPath = (property: Property): string =>
  `/properties/${property.id}/${encodeURIComponent(property.slug)}`;

export const toPriceLabel = (property: Property): string => {
  const rawPrice =
    property.price ?? property.sale_price ?? property.pre_sale_price ?? property.monthly_rent ?? null;
  if (!rawPrice || rawPrice <= 0) return "قیمت توافقی";
  return `${rawPrice.toLocaleString("en-US")} تومان`;
};

export const toLocationLabel = (property: Property): string => {
  const parts = [property.city_name, property.province_name].filter(Boolean);
  return parts.join("، ") || property.neighborhood || "-";
};

export const getMetaItems = (property: Property): Array<{ key: string; icon: ReactNode; value: string }> => {
  const result: Array<{ key: string; icon: ReactNode; value: string }> = [];

  if (property.bedrooms != null) {
    result.push({ key: "bedrooms", icon: <BedDouble className="h-4 w-4" />, value: String(property.bedrooms) });
  }

  if (property.bathrooms != null) {
    result.push({ key: "bathrooms", icon: <Bath className="h-4 w-4" />, value: String(property.bathrooms) });
  }

  if (property.built_area != null) {
    result.push({ key: "built_area", icon: <span className="text-[11px] font-semibold">متر</span>, value: String(property.built_area) });
  }

  return result.slice(0, 3);
};

export const getAgentName = (property: Property): string => {
  const fullName = (property.agent?.full_name || "").trim();
  if (fullName) return fullName;

  const firstName = (property.agent?.first_name || "").trim();
  const lastName = (property.agent?.last_name || "").trim();
  const composedName = `${firstName} ${lastName}`.trim();

  return composedName || "مشاور";
};

export const getAgentInitials = (property: Property): string => {
  const firstName = (property.agent?.first_name || "").trim();
  const lastName = (property.agent?.last_name || "").trim();

  const first = firstName ? firstName[0] : "";
  const last = lastName ? lastName[0] : "";
  const initials = `${first}${last}`.trim();
  if (initials) return initials;

  const name = getAgentName(property);
  return name[0] || "م";
};

export const getAgentAvatar = (property: Property): string | null => {
  const url = property.agent?.profile_picture_url || null;
  return url && url.trim() ? url : null;
};
