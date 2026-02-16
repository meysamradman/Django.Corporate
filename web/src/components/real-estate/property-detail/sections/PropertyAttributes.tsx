import type { Property } from "@/types/real-estate/property";

type PropertyAttributesProps = {
  property: Pick<Property, "extra_attributes">;
  className?: string;
};

type StandardAttributeConfig = {
  key: string;
  label: string;
};

const STANDARD_ATTRIBUTES: StandardAttributeConfig[] = [
  { key: "building_usage", label: "نوع کاربری" },
  { key: "direction", label: "جهت ملک" },
  { key: "location_type", label: "موقعیت جغرافیایی" },
  { key: "property_status", label: "وضعیت ملک" },
  { key: "unit_number", label: "شماره واحد" },
  { key: "property_condition", label: "وضعیت ملک" },
  { key: "property_direction", label: "جهت ملک" },
  { key: "city_position", label: "موقعیت در شهر" },
  { key: "unit_type", label: "نوع واحد" },
  { key: "construction_status", label: "وضعیت ساخت" },
  { key: "space_type", label: "نوع کاربری" },
];

const STANDARD_KEYS = new Set(STANDARD_ATTRIBUTES.map((x) => x.key));

function formatFaNumber(value: number) {
  try {
    return value.toLocaleString("fa-IR");
  } catch {
    return String(value);
  }
}

function isEmptyValue(value: unknown) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === "object" && !Array.isArray(value)) {
    try {
      return Object.keys(value as Record<string, unknown>).length === 0;
    } catch {
      return false;
    }
  }
  return false;
}

function formatValue(value: unknown): string {
  if (value === true) return "دارد";
  if (value === false) return "ندارد";
  if (value === null || value === undefined) return "—";

  if (typeof value === "number") return formatFaNumber(value);
  if (typeof value === "string") return value.trim() ? value : "—";

  if (Array.isArray(value)) {
    const allPrimitive = value.every(
      (x) =>
        x === null ||
        x === undefined ||
        typeof x === "string" ||
        typeof x === "number" ||
        typeof x === "boolean"
    );

    if (allPrimitive) {
      const parts = value
        .filter((x) => x !== null && x !== undefined)
        .map((x) => (typeof x === "number" ? formatFaNumber(x) : String(x)));
      return parts.length ? parts.join("، ") : "—";
    }

    try {
      return JSON.stringify(value);
    } catch {
      return "—";
    }
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "—";
    }
  }

  return String(value);
}

export default function PropertyAttributes({
  property,
  className,
}: PropertyAttributesProps) {
  const raw = property.extra_attributes;

  const attributes: Record<string, unknown> =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  const allEntries = Object.entries(attributes).filter(([, v]) => !isEmptyValue(v));
  if (allEntries.length === 0) return null;

  const standardItems = STANDARD_ATTRIBUTES.filter(
    (cfg) => !isEmptyValue(attributes[cfg.key])
  ).map((cfg) => ({
    ...cfg,
    value: attributes[cfg.key],
  }));

  const customItems = allEntries.filter(([key]) => !STANDARD_KEYS.has(key));

  return (
    <section
      className={
        className ||
        "bg-wt border border-br/50 rounded-2xl overflow-hidden"
      }
    >
      <div className="px-6 py-5 border-b border-br/50">
        <h2 className="text-lg font-black text-font-p">مشخصات و ویژگی‌های تکمیلی</h2>
      </div>

      <div className="p-6 space-y-10">
        {standardItems.length ? (
          <div>
            <h3 className="text-sm font-black text-font-p">
              مشخصات تکمیلی (استاندارد)
            </h3>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {standardItems.map((item) => (
                <div
                  key={item.key}
                  className="border border-br/50 bg-card rounded-xl p-4"
                >
                  <div className="text-xs font-black text-font-s">
                    {item.label}
                  </div>
                  <div className="mt-2 text-base font-black text-font-p wrap-break-word">
                    {formatValue(item.value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {customItems.length ? (
          <div>
            <h3 className="text-sm font-black text-font-p">
              سایر اطلاعات و فیلدهای اضافی
            </h3>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              {customItems.map(([key, value]) => (
                <div
                  key={key}
                  className="border border-br/50 bg-card rounded-xl p-4 flex items-center justify-between gap-6"
                >
                  <span className="text-sm font-black text-font-p wrap-break-word">
                    {key}
                  </span>
                  <span className="text-xs font-black text-font-s bg-bg px-3 py-1 rounded-lg wrap-break-word text-left">
                    {formatValue(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
