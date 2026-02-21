import { useEffect, useMemo, useState } from "react";
import { 
  Building2, 
  MapPin, 
  Home, 
  Tag, 
  Search,
  ArrowUpRight
} from "lucide-react";
import { Badge } from "@/components/elements/Badge";
import { Button } from "@/components/elements/Button";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { PaginationControls } from "@/components/shared/paginations/PaginationControls";

export interface ProfilePropertyItem {
  id: number;
  title: string;
  city: string;
  propertyType: string;
  dealType: "فروش" | "اجاره" | "رهن و اجاره" | "پیش‌فروش";
  status: "فعال" | "در انتظار" | "غیرفعال";
  price: string;
  viewLink: string;
}

interface ProfilePropertiesListProps {
  isConsultant: boolean;
  properties: ProfilePropertyItem[];
}

export function ProfilePropertiesList({
  isConsultant,
  properties,
}: ProfilePropertiesListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");

  // Simple search filter
  const filteredProperties = useMemo(() => {
    if (!searchTerm) return properties;
    return properties.filter(p => 
      p.title.includes(searchTerm) || 
      p.city.includes(searchTerm) ||
      p.price.includes(searchTerm)
    );
  }, [properties, searchTerm]);

  const totalCount = filteredProperties.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, pageSize]); // Reset to page 1 if pages change significantly

  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredProperties.slice(startIndex, startIndex + pageSize);
  }, [filteredProperties, currentPage, pageSize]);

  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalCount);

  return (
    <CardWithIcon
      icon={Building2}
      title={isConsultant ? "لیست املاک و آگهی‌ها" : "لیست املاک ثبت‌شده"}
      iconBgColor="bg-teal-0"
      iconColor="text-teal-1"
      cardBorderColor="border-b-teal-1"
      titleExtra={
        <div className="flex items-center gap-2">
            <span className="text-[10px] text-font-s hidden sm:inline-block">تعداد کل:</span>
            <Badge variant="gray">{totalCount}</Badge>
        </div>
      }
    >
      <div className="space-y-6">
        
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:max-w-xs">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-font-s pointer-events-none" />
                <input 
                  type="text" 
                  placeholder="جستجو در املاک (عنوان، شهر، قیمت)..." 
                  className="w-full h-10 pr-10 pl-4 rounded-xl bg-bg border border-br/60 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-sm outline-none text-font-p"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                 {/* Mock Filters for visual balance */}
                 <div className="px-3 py-2 rounded-lg border border-br/60 bg-bg text-xs font-medium text-font-s cursor-pointer hover:bg-divi/40 transition-colors whitespace-nowrap">
                    همه وضعیت‌ها
                 </div>
                 <div className="px-3 py-2 rounded-lg border border-br/60 bg-bg text-xs font-medium text-font-s cursor-pointer hover:bg-divi/40 transition-colors whitespace-nowrap">
                    مرتب‌سازی: جدیدترین
                 </div>
            </div>
        </div>
        
        {currentItems.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-br/50 bg-card shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                <thead>
                    <tr className="bg-divi/30 border-b border-br/50 text-xs text-font-s/80">
                        <th className="px-6 py-4 text-right font-semibold w-[35%]">عنوان و شناسه</th>
                        <th className="px-6 py-4 text-right font-semibold">موقعیت</th>
                        <th className="px-6 py-4 text-right font-semibold">نوع ملک</th>
                        <th className="px-6 py-4 text-left font-semibold pl-10">قیمت (تومان)</th>
                        <th className="px-6 py-4 text-center font-semibold">وضعیت</th>
                        <th className="px-6 py-4 text-left font-semibold w-24 pl-6">عملیات</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-br/40">
                    {currentItems.map((property) => (
                    <tr 
                        key={property.id} 
                    className="group transition-all hover:bg-divi/20"
                    >
                        {/* Title Column */}
                        <td className="px-6 py-4">
                            <div className="flex items-start gap-4">
                                <div className="size-11 rounded-xl bg-divi/40 border border-br/20 flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <Home className="size-5 opacity-70" />
                                </div>
                                <div className="flex flex-col gap-1.5 min-w-0">
                                    <a 
                                        href={property.viewLink}
                                    className="font-semibold text-font-p hover:text-primary transition-colors truncate block max-w-50"
                                        title={property.title}
                                    >
                                        {property.title}
                                    </a>
                                  <div className="flex items-center gap-2 text-[10px] text-font-s/80">
                                    <span className="bg-divi/40 px-1.5 py-0.5 rounded text-[9px] border border-br/20">#{property.id}</span>
                                    <span className="w-px h-2.5 bg-br/60"></span>
                                    <span className="px-1.5 py-0.5 rounded bg-blue-0 text-blue-1 border border-blue">
                                            {property.dealType}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </td>

                        {/* Location */}
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-font-s group-hover:text-font-p transition-colors">
                                <MapPin className="size-4 opacity-50" />
                                <span className="font-medium">{property.city}</span>
                           </div>
                        </td>

                        {/* Type */}
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Tag className="size-4 opacity-50 text-font-s" />
                              <span className="text-font-p/90">{property.propertyType}</span>
                            </div>
                        </td>

                        {/* Price */}
                        <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1.5 font-bold text-font-p">
                                <span className="text-sm tracking-tight">{property.price}</span>
                           </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 text-center">
                            <div className="flex justify-center">
                                <StatusBadge status={property.status} />
                            </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                             <div className="flex justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="h-8 px-3 rounded-lg border-br text-font-s hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all gap-1.5 text-xs font-medium shadow-sm hover:shadow-md active:scale-95"
                              >
                                <a 
                                    href={property.viewLink} 
                                >
                                    <span>مشاهده</span>
                                    <ArrowUpRight className="size-3" />
                                </a>
                              </Button>
                             </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
          </div>
        ) : (
           <div className="flex flex-col gap-4 h-64 items-center justify-center rounded-2xl border border-dashed border-br bg-divi/20 text-font-s w-full">
             <div className="size-20 rounded-full bg-divi/40 flex items-center justify-center mb-2">
                 <Search className="size-10 opacity-20" />
             </div>
             <p className="text-base font-medium text-font-p/60">نتیجه‌ای یافت نشد!</p>
             <p className="text-sm opacity-60">لطفا با کلمات کلیدی دیگری جستجو کنید.</p>
          </div>
        )}

          <div className="flex justify-center border-t border-br/40 pt-6">
             <div className="w-full max-w-3xl">
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    pageSize={pageSize}
                    onPageSizeChange={(size) => {
                        setPageSize(size);
                        setCurrentPage(1);
                    }}
                    pageSizeOptions={[5, 10, 20]}
                    showInfo={true}
                    infoText={`${rangeStart} - ${rangeEnd} از ${totalCount}`}
                    totalCount={totalCount}
                />
             </div>
        </div>
       
      </div>
    </CardWithIcon>
  );
}

const StatusBadge = ({ status }: { status: string }) => {
  const variantMap: Record<string, "green" | "amber" | "gray"> = {
    "فعال": "green",
    "در انتظار": "amber",
    "غیرفعال": "gray",
  };

  const dotClassMap: Record<string, string> = {
    "فعال": "bg-green-1",
    "در انتظار": "bg-amber-1",
    "غیرفعال": "bg-gray-1 animate-pulse",
  };

  const variant = variantMap[status] || "gray";
  const dotClass = dotClassMap[status] || "bg-gray-1 animate-pulse";

    return (
    <Badge variant={variant} className="rounded-full px-2.5 py-1 text-[11px] font-medium">
      <span className={`size-1.5 rounded-full mr-1.5 ${dotClass}`}></span>
      <span>{status}</span>
    </Badge>
    )
}
