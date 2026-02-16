import { Check } from "lucide-react";

import type { Property } from "@/types/real-estate/property";

type PropertyFeaturesProps = {
  property: Pick<Property, "features">;
  className?: string;
};

export default function PropertyFeatures({ property, className }: PropertyFeaturesProps) {
  const features = Array.isArray(property.features) ? property.features.filter(Boolean) : [];
  if (!features.length) return null;

  const grouped = new Map<string, typeof features>();
  for (const feature of features) {
    const groupNameRaw = (feature as any)?.group || "ویژگی‌ها";
    const groupName = groupNameRaw === "Features" ? "ویژگی‌ها" : groupNameRaw;
    const list = grouped.get(groupName);
    if (list) list.push(feature);
    else grouped.set(groupName, [feature]);
  }

  const groups = Array.from(grouped.entries()).sort(([a], [b]) =>
    String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" })
  );

  return (
    <section
      className={
        className ||
        "bg-wt border border-br/50 rounded-2xl overflow-hidden"
      }
    >
      <div className="px-6 py-5 border-b border-br/50">
        <h2 className="text-lg font-black text-font-p">ویژگی‌ها</h2>
      </div>

      <div className="px-6 py-6 space-y-6">
        {groups.map(([groupName, items], groupIndex) => (
          <div key={groupName}>
            <h3 className="text-sm font-black text-font-p">{groupName}</h3>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-8">
              {items.map((feature) => (
                <div key={feature.id} className="flex items-center gap-2.5 text-sm font-bold text-font-p">
                  <span className="w-6 h-6 rounded-full border border-br/50 bg-bg flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-blue-1" />
                  </span>
                  <span>{feature.name}</span>
                </div>
              ))}
            </div>

            {groupIndex !== groups.length - 1 ? (
              <div className="mt-6 border-t border-br/40" />
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
