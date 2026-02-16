import { Bath, BedDouble, DollarSign, Ruler } from "lucide-react";

import type { FloorPlan } from "@/types/real-estate/property";

type PropertyFloorPlansProps = {
  floorPlans?: FloorPlan[] | null;
  className?: string;
};

function formatNumber(value: number) {
  try {
    return new Intl.NumberFormat("en-US").format(value);
  } catch {
    return String(value);
  }
}

function getSizeUnitLabel(unit?: string | null) {
  if (unit === "sqft") return "Sq Ft";
  if (unit === "sqm") return "Sq M";
  return unit || "";
}

export default function PropertyFloorPlans({
  floorPlans,
  className,
}: PropertyFloorPlansProps) {
  const plans = Array.isArray(floorPlans) ? floorPlans.filter(Boolean) : [];
  if (!plans.length) return null;

  return (
    <section
      className={
        className ||
        "bg-wt border border-br/50 rounded-2xl overflow-hidden"
      }
    >
      <div className="px-6 py-5 border-b border-br/50">
        <h2 className="text-lg font-black text-font-p">Floor Plans</h2>
      </div>

      <div className="divide-y divide-br/40">
        {plans.map((plan, index) => {
          const sizeLabel = getSizeUnitLabel(plan.size_unit);
          const sizeText =
            typeof plan.floor_size === "number"
              ? `${formatNumber(plan.floor_size)} ${sizeLabel}`.trim()
              : null;

          const bedroomsText =
            typeof plan.bedrooms === "number" ? String(plan.bedrooms) : null;
          const bathroomsText =
            typeof plan.bathrooms === "number" ? String(plan.bathrooms) : null;

          const priceText =
            typeof plan.price === "number"
              ? `${plan.currency ? plan.currency + " " : ""}${formatNumber(
                  plan.price
                )}`
              : null;

          const mainImageUrl = plan.main_image?.url || null;

          return (
            <details
              key={plan.id}
              open={index === 0}
              className="group"
            >
              <summary className="list-none cursor-pointer select-none px-6 py-4 flex items-center gap-3">
                <span className="relative w-4 h-4 rounded-full border border-br/60 flex items-center justify-center shrink-0">
                  <span className="w-2 h-2 rounded-full bg-blue-1 scale-0 group-open:scale-100 transition-transform" />
                </span>

                <span className="text-sm font-black text-font-p">
                  {plan.title}
                </span>

                <span className="mr-auto flex items-center gap-5 text-[11px] font-bold text-font-s">
                  {sizeText ? (
                    <span className="flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5" />
                      <span>Size: {sizeText}</span>
                    </span>
                  ) : null}

                  {bedroomsText ? (
                    <span className="flex items-center gap-1.5">
                      <BedDouble className="w-3.5 h-3.5" />
                      <span>{bedroomsText}</span>
                    </span>
                  ) : null}

                  {bathroomsText ? (
                    <span className="flex items-center gap-1.5">
                      <Bath className="w-3.5 h-3.5" />
                      <span>{bathroomsText}</span>
                    </span>
                  ) : null}

                  {priceText ? (
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Price: {priceText}</span>
                    </span>
                  ) : null}
                </span>
              </summary>

              <div className="px-6 pb-6 pt-2">
                {mainImageUrl ? (
                  <div className="w-full rounded-xl overflow-hidden border border-br/50 bg-bg">
                    <img
                      src={mainImageUrl}
                      alt={plan.main_image?.title || plan.title}
                      className="w-full h-auto object-contain"
                      loading="lazy"
                    />
                  </div>
                ) : null}

                {plan.description ? (
                  <div className="pt-4">
                    <p className="text-xs font-black text-font-p">Description:</p>
                    <p className="mt-2 text-sm leading-7 text-font-s">
                      {plan.description}
                    </p>
                  </div>
                ) : null}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
