import type { Property } from "@/types/real-estate/property";
import {
  formatArea as formatAreaFa,
  formatPriceToPersian,
} from "@/core/utils/realEstateFormat";

type PropertyDetailsProps = {
  property: Pick<
    Property,
    | "id"
    | "status"
    | "property_type"
    | "price"
    | "sale_price"
    | "monthly_rent"
    | "mortgage_amount"
    | "rent_amount"
    | "security_deposit"
    | "built_area"
    | "land_area"
    | "bedrooms"
    | "bathrooms"
    | "kitchens"
    | "living_rooms"
    | "parking_spaces"
    | "storage_rooms"
    | "floors_in_building"
    | "floor_number"
    | "year_built"
    | "build_years"
    | "document_type"
    | "has_document"
  >;
  className?: string;
};

function formatFa(value: number) {
  try {
    return value.toLocaleString("fa-IR");
  } catch {
    return String(value);
  }
}

function formatMoney(value: number) {
  return formatPriceToPersian(value, "تومان");
}

function formatStatus(status?: string | null) {
  if (!status) return null;
  if (status === "for_sale") return "برای فروش";
  if (status === "for_rent") return "برای اجاره";
  if (status === "active") return "فعال";
  if (status === "pending") return "در انتظار";
  if (status === "sold") return "فروخته شده";
  if (status === "rented") return "اجاره رفت";
  return status;
}

function rowValue(value: React.ReactNode) {
  return <span className="text-sm font-black text-font-p">{value}</span>;
}

type Row = {
  leftLabel: string;
  leftValue: React.ReactNode;
  rightLabel?: string;
  rightValue?: React.ReactNode;
};

export default function PropertyDetails({ property, className }: PropertyDetailsProps) {
  const detailsRows: Row[] = [];

  const propertyId = typeof property.id === "number" ? `HZ-${property.id}` : null;
  const statusText = formatStatus(property.status);
  const typeText = property.property_type?.name || null;

  const displayPrice =
    property.sale_price ??
    property.price ??
    property.monthly_rent ??
    property.rent_amount ??
    null;

  detailsRows.push({
    leftLabel: "شناسه ملک",
    leftValue: rowValue(propertyId || "—"),
    rightLabel: "قیمت",
    rightValue: rowValue(displayPrice != null ? formatMoney(displayPrice) : "—"),
  });

  if (property.built_area != null || property.land_area != null) {
    detailsRows.push({
      leftLabel: "زیربنا",
      leftValue: rowValue(
        property.built_area != null ? formatAreaFa(Number(property.built_area)) : "—"
      ),
      rightLabel: "مساحت زمین",
      rightValue: rowValue(
        property.land_area != null ? formatAreaFa(Number(property.land_area)) : "—"
      ),
    });
  }

  if (property.bedrooms != null || property.bathrooms != null) {
    detailsRows.push({
      leftLabel: "اتاق خواب",
      leftValue: rowValue(
        property.bedrooms != null ? formatFa(Number(property.bedrooms)) : "—"
      ),
      rightLabel: "سرویس بهداشتی",
      rightValue: rowValue(
        property.bathrooms != null ? formatFa(Number(property.bathrooms)) : "—"
      ),
    });
  }

  if (property.kitchens != null || property.living_rooms != null) {
    detailsRows.push({
      leftLabel: "آشپزخانه",
      leftValue: rowValue(
        property.kitchens != null ? formatFa(Number(property.kitchens)) : "—"
      ),
      rightLabel: "پذیرایی",
      rightValue: rowValue(
        property.living_rooms != null ? formatFa(Number(property.living_rooms)) : "—"
      ),
    });
  }

  detailsRows.push({
    leftLabel: "نوع ملک",
    leftValue: rowValue(typeText || "—"),
    rightLabel: "وضعیت",
    rightValue: rowValue(statusText || "—"),
  });

  const additional: Array<{ label: string; value: React.ReactNode }> = [];

  if (property.mortgage_amount != null || property.security_deposit != null) {
    additional.push({
      label: "رهن / ودیعه",
      value: rowValue(
        formatMoney(
          Number(property.mortgage_amount ?? property.security_deposit ?? 0)
        )
      ),
    });
  }

  if (property.monthly_rent != null || property.rent_amount != null) {
    additional.push({
      label: "اجاره ماهانه",
      value: rowValue(formatMoney(Number(property.monthly_rent ?? property.rent_amount ?? 0))),
    });
  }

  if (property.parking_spaces != null) {
    additional.push({
      label: "پارکینگ",
      value: rowValue(formatFa(Number(property.parking_spaces))),
    });
  }

  if (property.storage_rooms != null) {
    additional.push({
      label: "انباری",
      value: rowValue(formatFa(Number(property.storage_rooms))),
    });
  }

  if (property.floors_in_building != null) {
    additional.push({
      label: "تعداد کل طبقات",
      value: rowValue(formatFa(Number(property.floors_in_building))),
    });
  }

  if (property.floor_number != null) {
    additional.push({
      label: "طبقه ملک",
      value: rowValue(formatFa(Number(property.floor_number))),
    });
  }

  if (property.year_built != null) {
    additional.push({
      label: "سال ساخت",
      value: rowValue(String(property.year_built)),
    });
  }

  if (property.build_years != null) {
    additional.push({
      label: "سن بنا",
      value: rowValue(`${formatFa(Number(property.build_years))} سال`),
    });
  }

  if (property.document_type) {
    additional.push({
      label: "نوع سند",
      value: rowValue(property.document_type),
    });
  }

  if (property.has_document !== null && property.has_document !== undefined) {
    additional.push({
      label: "وضعیت سند",
      value: rowValue(property.has_document ? "دارد" : "ندارد"),
    });
  }

  const hasAny = detailsRows.length > 0 || additional.length > 0;
  if (!hasAny) return null;

  return (
    <section
      className={
        className ||
        "bg-wt border border-br/50 rounded-2xl overflow-hidden"
      }
    >
      <div className="px-6 py-5 border-b border-br/50">
        <h2 className="text-lg font-black text-font-p">جزئیات</h2>
      </div>

      <div className="p-6">
        <div className="border border-blue-1/40 rounded-xl overflow-hidden">
          <div className="divide-y divide-blue-1/25">
            {detailsRows.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-1 md:grid-cols-2 bg-blue-1/5"
              >
                <div className="flex items-center justify-between gap-6 px-5 py-3 md:border-l border-blue-1/25">
                  <span className="text-xs font-black text-font-s">
                    {row.leftLabel}
                  </span>
                  <span className="text-left">{row.leftValue}</span>
                </div>

                <div className="flex items-center justify-between gap-6 px-5 py-3">
                  <span className="text-xs font-black text-font-s">
                    {row.rightLabel || ""}
                  </span>
                  <span className="text-left">{row.rightValue ?? ""}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {additional.length ? (
          <div className="mt-8">
            <h3 className="text-sm font-black text-font-p">جزئیات بیشتر</h3>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-12">
              {additional.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-6 py-3 border-b border-br/40"
                >
                  <span className="text-xs font-black text-font-s">
                    {item.label}
                  </span>
                  <span className="text-left">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
