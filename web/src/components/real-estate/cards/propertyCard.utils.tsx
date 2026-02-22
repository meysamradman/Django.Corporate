import { BedDouble, Bath } from "lucide-react";
import type { ReactNode } from "react";

import { formatArea } from "@/core/utils/realEstateFormat";
import { formatPriceToPersian } from "@/core/utils/realEstateFormat";
import type { Property } from "@/types/real-estate/property";

export const getPropertyCanonicalPath = (property: Property): string =>
  `/properties/${property.id}/${encodeURIComponent(property.slug)}`;

export const toPriceLabel = (property: Property): string => {
  const salePrice = property.sale_price ?? property.price ?? property.pre_sale_price ?? null;
  const mortgagePrice = property.mortgage_amount ?? property.security_deposit ?? null;
  const monthlyRentPrice = property.monthly_rent ?? property.rent_amount ?? null;
  const usageType = property.state?.usage_type;

  const hasMortgage = typeof mortgagePrice === "number" && mortgagePrice > 0;
  const hasMonthlyRent = typeof monthlyRentPrice === "number" && monthlyRentPrice > 0;

  if (usageType === "rent") {
    const rentParts: string[] = [];

    if (hasMortgage) {
      rentParts.push(`رهن: ${formatPriceToPersian(mortgagePrice, "تومان")}`);
    }

    if (hasMonthlyRent) {
      rentParts.push(`اجاره: ${formatPriceToPersian(monthlyRentPrice, "تومان")}`);
    }

    if (rentParts.length > 0) {
      return rentParts.join(" | ");
    }

    return "قیمت توافقی";
  }

  if (usageType === "mortgage") {
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
