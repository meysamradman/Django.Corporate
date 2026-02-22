import { BedDouble, Bath } from "lucide-react";
import type { ReactNode } from "react";

import { formatArea, formatPriceToPersian } from "@/core/utils/realEstateFormat";
import type { Property } from "@/types/real-estate/property";

export const getPropertyCanonicalPath = (property: Property): string =>
  `/properties/${property.id}/${encodeURIComponent(property.slug)}`;

const toPositiveNumber = (value: unknown): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  if (typeof value === "string") {
    const normalizedDigits = value
      .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 1728))
      .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632));

    const cleaned = normalizedDigits
      .replace(/[٬,]/g, "")
      .replace(/[^\d.-]/g, "")
      .trim();

    const normalized = Number(cleaned);
    return Number.isFinite(normalized) && normalized > 0 ? normalized : null;
  }

  return null;
};

type DealKind = "rent" | "mortgage" | "sale";

const getDealKind = (property: Property): DealKind => {
  const usageType = (property.state?.usage_type || "").toLowerCase().trim();
  if (usageType === "rent") return "rent";
  if (usageType === "mortgage") return "mortgage";
  return "sale";
};

export const toPriceLabel = (property: Property): string => {
  const dealKind = getDealKind(property);

  const salePrice =
    toPositiveNumber(property.sale_price) ??
    toPositiveNumber(property.price) ??
    toPositiveNumber(property.pre_sale_price);

  const mortgagePrice =
    toPositiveNumber(property.mortgage_amount) ??
    toPositiveNumber(property.security_deposit);

  const monthlyRentPrice =
    toPositiveNumber(property.rent_amount) ??
    toPositiveNumber(property.monthly_rent) ??
    (dealKind === "rent"
      ? toPositiveNumber(property.price) ??
        toPositiveNumber(property.sale_price) ??
        toPositiveNumber(property.pre_sale_price)
      : null);

  const hasMortgage = mortgagePrice != null;
  const hasMonthlyRent = monthlyRentPrice != null;

  if (dealKind === "rent") {
    const mortgageLabel = hasMortgage
      ? formatPriceToPersian(mortgagePrice, "تومان")
      : "توافقی";

    const rentLabel = hasMonthlyRent
      ? formatPriceToPersian(monthlyRentPrice, "تومان")
      : "توافقی";

    return `رهن: ${mortgageLabel} | اجاره: ${rentLabel}`;
  }

  if (dealKind === "mortgage") {
    if (hasMortgage) {
      return `رهن کامل: ${formatPriceToPersian(mortgagePrice, "تومان")}`;
    }

    return "قیمت توافقی";
  }

  if (typeof salePrice === "number" && salePrice > 0) {
    return formatPriceToPersian(salePrice, "تومان");
  }

  return "قیمت توافقی";
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
    result.push({ key: "built_area", icon: <span className="text-[11px] font-semibold">•</span>, value: formatArea(Number(property.built_area)) });
  }

  return result.slice(0, 3);
};

export const getAgentName = (property: Property): string => {
  const ownerName = (property.owner_name || "").trim();
  if (ownerName) return ownerName;

  const fullName = (property.agent?.full_name || "").trim();
  if (fullName) return fullName;

  const firstName = (property.agent?.first_name || "").trim();
  const lastName = (property.agent?.last_name || "").trim();
  const composedName = `${firstName} ${lastName}`.trim();

  if (composedName) return composedName;

  const createdBy = (property.created_by || "").trim();
  if (createdBy) return createdBy;

  return "ادمین سیستم";
};

const hasValidAgentOwner = (property: Property): boolean => {
  if (property.owner_type === "agent") {
    return true;
  }

  if (property.owner_type === "admin") {
    return false;
  }

  const licenseNumber = (property.agent?.license_number || "").trim();
  return Boolean(licenseNumber);
};

export const getOwnerRoleLabel = (property: Property): string => {
  return hasValidAgentOwner(property) ? "مشاور" : "ادمین";
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
