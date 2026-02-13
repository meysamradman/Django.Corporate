export interface ReverseGeocodeResult {
  display_name?: string;
  address?: Record<string, any>;
}

export function normalizeCoordinateText(value: string): string {
  return String(value || "")
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/،/g, ",")
    .trim();
}

export function parseCombinedCoordinates(value: string): { lat: number; lng: number } | null {
  const normalized = normalizeCoordinateText(value);
  if (!normalized) return null;

  const parts = normalized.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length !== 2) return null;

  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
}

export function normalizeLocationName(value: string): string {
  return String(value || "")
    .replace(/استان\s+/g, "")
    .replace(/شهر\s+/g, "")
    .replace(/[ي]/g, "ی")
    .replace(/[ك]/g, "ک")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function buildAddressFromReverseData(data: ReverseGeocodeResult): { address: string; neighborhood?: string } {
  const addr = data?.address || {};
  const parts: string[] = [];

  if (addr.state) {
    const province = String(addr.state).replace(/^استان\s+/, "").trim();
    if (province) parts.push(`استان ${province}`);
  }

  const neighborhoodRaw = String(addr.locality || addr.neighbourhood || "").trim();
  if (neighborhoodRaw && !/منطقه|District/i.test(neighborhoodRaw)) {
    parts.push(neighborhoodRaw);
  } else if (addr.suburb && !/منطقه|District/i.test(String(addr.suburb))) {
    parts.push(String(addr.suburb).trim());
  }

  let region = String(addr.city_district || "").trim();
  if (!region || !/منطقه|District/i.test(region)) {
    if (addr.suburb && /منطقه|District/i.test(String(addr.suburb))) {
      region = String(addr.suburb).trim();
    } else if (addr.neighbourhood && /منطقه|District/i.test(String(addr.neighbourhood))) {
      region = String(addr.neighbourhood).trim();
    }
  }

  if (region) {
    const regionNormalized = normalizeCoordinateText(region);
    const regionMatch = regionNormalized.match(/منطقه\s*(\d+)/i) || regionNormalized.match(/District\s*(\d+)/i);
    if (regionMatch) {
      parts.push(`منطقه ${regionMatch[1]}`);
    } else {
      parts.push(region.replace(/\s*تهران\s*/g, "").trim());
    }
  }

  const street = String(addr.road || addr.pedestrian || addr.path || "").trim();
  if (street) parts.push(`خیابان ${street}`);

  const uniqueParts = parts.filter(Boolean).filter((part, idx, arr) => arr.findIndex((x) => x === part) === idx);
  const finalAddress = uniqueParts.join(", ");
  const neighborhood = neighborhoodRaw && !/منطقه|District/i.test(neighborhoodRaw) ? neighborhoodRaw : undefined;

  return {
    address: finalAddress || String(data?.display_name || "").trim(),
    neighborhood,
  };
}
