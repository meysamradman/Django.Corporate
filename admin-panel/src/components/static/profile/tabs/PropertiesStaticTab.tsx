import { Badge } from "@/components/elements/Badge";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Building2 } from "lucide-react";

export interface StaticPropertyItem {
  id: number;
  title: string;
  city: string;
  category: string;
  status: string;
  price: string;
}

interface PropertiesStaticTabProps {
  isConsultant: boolean;
  adminProperties: StaticPropertyItem[];
  consultantProperties: StaticPropertyItem[];
}

export function PropertiesStaticTab({
  isConsultant,
  adminProperties,
  consultantProperties,
}: PropertiesStaticTabProps) {
  const list = isConsultant ? consultantProperties : adminProperties;

  return (
    <CardWithIcon
      icon={Building2}
      title={isConsultant ? "لیست املاک مشاور" : "لیست املاک ادمین"}
      iconBgColor="bg-indigo"
      iconColor="stroke-indigo-2"
      cardBorderColor="border-b-indigo-1"
      className="gap-0"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">تعداد: {list.length}</Badge>
          <Badge variant={isConsultant ? "teal" : "blue"}>{isConsultant ? "نمای مشاور" : "نمای ادمین"}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {list.map((property) => (
            <div key={property.id} className="rounded-xl border border-br bg-card p-3 space-y-2 hover:bg-card-2/40 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-font-p">{property.title}</p>
                <Badge variant="gray">#{property.id}</Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-font-s">
                <span>{property.city}</span>
                <span>{property.category}</span>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant={property.status === "فعال" ? "green" : "yellow"}>{property.status}</Badge>
                <p className="text-sm font-bold text-font-p">{property.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CardWithIcon>
  );
}
