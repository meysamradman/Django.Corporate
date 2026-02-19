import { Badge } from "@/components/elements/Badge";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { Building2, Home, Clock, DollarSign, Activity, MapPin, Tag, ArrowLeft, ExternalLink, MoreHorizontal, MousePointerClick } from "lucide-react";
import { cn } from "@/core/utils/cn";

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
  const fullList = isConsultant ? consultantProperties : adminProperties;
  
  // Logic: Show only the latest 6 items to avoid overcrowding the profile
  const recentList = fullList.slice(0, 6);
  const remainingCount = Math.max(0, fullList.length - 6);

  // Mock Statistics Calculation
  const total = fullList.length;
  const active = fullList.filter((p) => p.status === "فعال").length;
  const pending = fullList.filter((p) => p.status === "در انتظار").length;
  const totalValue = fullList.reduce((acc, curr) => {
    const num = parseFloat(curr.price.replace(/[^0-9.]/g, "")); 
    return acc + (isNaN(num) ? 0 : num);
  }, 0).toFixed(1);


  return (
    <div className="space-y-6">
      
      <CardWithIcon
        icon={Building2}
        title={isConsultant ? "آخرین املاک ثبت‌شده توسط مشاور" : "آخرین املاک ثبت‌شده توسط ادمین"}
        iconBgColor="bg-indigo"
        iconColor="stroke-indigo-2"
        cardBorderColor="border-b-indigo-1"
        className="gap-0"
        titleExtra={
            <Button variant="ghost" size="sm" className="gap-2 text-primary hover:bg-primary/5 hover:text-primary transition-colors">
                مدیریت کامل املاک
                <ExternalLink className="size-3.5" />
            </Button>
        }
      >
        <div className="space-y-4">
            {recentList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentList.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                ))}
                </div>
            ) : (
                <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-br bg-card/50 text-font-s">
                    <div className="flex size-12 items-center justify-center rounded-full bg-bg shadow-sm">
                       <Building2 className="size-6 opacity-40" />
                    </div>
                    <span className="text-sm font-medium">هیچ ملکی ثبت نشده است.</span>
                </div>
            )}

            {/* Pagination / View More Hint */}
            {remainingCount > 0 && (
                <div className="flex items-center justify-center pt-2">
                    <Button variant="outline" className="w-full md:w-auto gap-2 group border-br/60 hover:border-primary hover:text-primary">
                        مشاهده {remainingCount} ملک دیگر در لیست کامل
                        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
                    </Button>
                </div>
            )}
        </div>
      </CardWithIcon>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color 
}: { 
  title: string; 
  value: number | string; 
  icon: any; 
  trend: string;
  color: string;
}) {
  const isPositive = trend.startsWith("+");
  
  return (
    <div className="group relative flex flex-col justify-between gap-4 rounded-2xl border border-br/60 bg-card p-5 transition-all duration-300 hover:border-primary/20 hover:bg-card-2/50 hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset transition-all duration-300 group-hover:scale-110", color)}>
          <Icon className="size-6" />
        </div>
        <Badge variant={isPositive ? "green" : "red"} className="text-[10px] px-2 h-6 font-bold dir-ltr shadow-sm">
          {trend}
        </Badge>
      </div>
      <div className="space-y-1">
        <h4 className="text-2xl font-bold text-font-p font-number tracking-tight">{value}</h4>
        <span className="text-xs font-medium text-font-s/80 group-hover:text-font-p transition-colors">{title}</span>
      </div>
    </div>
  );
}

function PropertyCard({ property }: { property: StaticPropertyItem }) {
  const isPending = property.status === "در انتظار";
  
  return (
    <div className="group relative flex flex-col gap-4 rounded-2xl border border-br/60 bg-card p-4 transition-all duration-300 hover:border-primary/20 hover:bg-card-2/50 hover:shadow-md hover:-translate-y-1">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-bg border border-br/60 text-font-s/50 group-hover:border-primary/20 group-hover:bg-primary/5 group-hover:text-primary transition-all">
            <Building2 className="size-6" />
          </div>
          <div className="min-w-0 space-y-1.5 flex-1">
            <h5 className="font-semibold text-font-p text-sm truncate group-hover:text-primary transition-colors">
              {property.title}
            </h5>
            <div className="flex items-center gap-2 text-xs text-font-s/90">
              <Badge variant="outline" className="h-5 px-1.5 gap-1 font-normal bg-bg/50 border-br/50">
                <MapPin className="size-3" />
                {property.city}
              </Badge>
              <Badge variant="outline" className="h-5 px-1.5 gap-1 font-normal bg-bg/50 border-br/50">
                <Tag className="size-3" />
                {property.category}
              </Badge>
            </div>
          </div>
        </div>
        
        <Button size="icon" variant="ghost" className="size-8 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="size-4 text-font-s" />
        </Button>
      </div>
      
      <div className="mt-auto flex items-center justify-between border-t border-br/40 pt-3">
        <Badge variant={isPending ? "yellow" : "green"} className="min-w-fit h-6 px-2.5 text-[10px]">
          {property.status}
        </Badge>
        <div className="flex flex-col items-end">
             <span className="text-sm font-bold text-font-p font-number group-hover:text-primary transition-colors">
            {property.price}
            </span>
             <span className="text-[10px] text-font-s/70">قیمت (تومان)</span>
        </div>
       
      </div>
      
      {/* Click overlay for detail view - simulates navigation */}
      <div className="absolute inset-0 z-10 cursor-pointer rounded-2xl" onClick={() => console.log('Navigate to property', property.id)} />
    </div>
  );
}
