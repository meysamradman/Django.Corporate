import { Map } from "lucide-react";

import { Button } from "@/components/elements/Button";
import type { Property } from "@/types/real-estate/property";

type PropertyLocationProps = {
  property: Pick<
    Property,
    | "address"
    | "province_name"
    | "city_name"
    | "district_name"
    | "neighborhood"
    | "postal_code"
    | "country_name"
    | "latitude"
    | "longitude"
  >;
};

function buildGoogleMapsUrl(property: PropertyLocationProps["property"]): string | null {
  const latRaw = property.latitude;
  const lngRaw = property.longitude;
  const lat = typeof latRaw === "number" ? latRaw : typeof latRaw === "string" ? Number(latRaw) : null;
  const lng = typeof lngRaw === "number" ? lngRaw : typeof lngRaw === "string" ? Number(lngRaw) : null;

  if (lat !== null && lng !== null && Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
  }

  const parts = [
    property.address,
    property.neighborhood,
    property.district_name,
    property.city_name,
    property.province_name,
    property.country_name,
  ]
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);

  if (!parts.length) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join("، "))}`;
}

function buildOsmEmbedUrl(property: PropertyLocationProps["property"]): string | null {
  const latRaw = property.latitude;
  const lngRaw = property.longitude;
  const lat = typeof latRaw === "number" ? latRaw : typeof latRaw === "string" ? Number(latRaw) : null;
  const lng = typeof lngRaw === "number" ? lngRaw : typeof lngRaw === "string" ? Number(lngRaw) : null;
  if (lat === null || lng === null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const delta = 0.01;
  const left = lng - delta;
  const right = lng + delta;
  const top = lat + delta;
  const bottom = lat - delta;

  const bbox = `${left},${bottom},${right},${top}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lng}`)}`;
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-2 gap-4 border-t border-br py-4 text-sm">
      <div className="font-medium text-font-s">{label}:</div>
      <div className="text-font-p text-left" dir="ltr">
        {value}
      </div>
    </div>
  );
}

export default function PropertyLocation({ property }: PropertyLocationProps) {
  const googleUrl = buildGoogleMapsUrl(property);
  const mapSrc = buildOsmEmbedUrl(property);

  const address = property.address || null;
  const city = property.city_name || null;
  const province = property.province_name || null;
  const postalCode = property.postal_code || null;

  const area = property.district_name || property.neighborhood || null;
  const country = property.country_name || "ایران";

  return (
    <section className="rounded-2xl border border-br bg-card p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-font-p">آدرس</h2>
        {googleUrl ? (
          <Button asChild className="gap-2" size="sm">
            <a href={googleUrl} target="_blank" rel="noreferrer">
              <Map className="size-4" />
              باز کردن در گوگل مپس
            </a>
          </Button>
        ) : null}
      </div>

      <div className="mt-6">
        <Row label="آدرس" value={address} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
          <div>
            <Row label="شهر" value={city} />
            <Row label="استان" value={province} />
            <Row label="منطقه" value={area} />
          </div>
          <div>
            <Row label="کد پستی" value={postalCode} />
            <Row label="کشور" value={country} />
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-br">
          {mapSrc ? (
            <iframe
              src={mapSrc}
              className="h-[360px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer"
              title="نقشه"
            />
          ) : (
            <div className="h-[360px] w-full bg-bg" />
          )}
        </div>
      </div>
    </section>
  );
}
