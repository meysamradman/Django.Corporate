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
      iconBgColor="bg-primary/10"
      iconColor="stroke-primary"
      cardBorderColor="border-primary/20"
      titleExtra={
        <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground hidden sm:inline-block">تعداد کل:</span>
            <Badge variant="gray" className="font-mono">{totalCount}</Badge>
        </div>
      }
    >
      <div className="space-y-6">
        
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:max-w-xs">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <input 
                  type="text" 
                  placeholder="جستجو در املاک (عنوان، شهر، قیمت)..." 
                  className="w-full h-10 pr-10 pl-4 rounded-xl bg-background border border-border/60 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-sm outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                 {/* Mock Filters for visual balance */}
                 <div className="px-3 py-2 rounded-lg border border-border/60 bg-background text-xs font-medium text-foreground/70 cursor-pointer hover:bg-secondary/50 transition-colors whitespace-nowrap">
                    همه وضعیت‌ها
                 </div>
                 <div className="px-3 py-2 rounded-lg border border-border/60 bg-background text-xs font-medium text-foreground/70 cursor-pointer hover:bg-secondary/50 transition-colors whitespace-nowrap">
                    مرتب‌سازی: جدیدترین
                 </div>
            </div>
        </div>
        
        {currentItems.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                <thead>
                    <tr className="bg-secondary/30 border-b border-border/50 text-xs text-muted-foreground/80">
                        <th className="px-6 py-4 text-right font-semibold w-[35%]">عنوان و شناسه</th>
                        <th className="px-6 py-4 text-right font-semibold">موقعیت</th>
                        <th className="px-6 py-4 text-right font-semibold">نوع ملک</th>
                        <th className="px-6 py-4 text-left font-semibold pl-10">قیمت (تومان)</th>
                        <th className="px-6 py-4 text-center font-semibold">وضعیت</th>
                        <th className="px-6 py-4 text-left font-semibold w-24 pl-6">عملیات</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                    {currentItems.map((property) => (
                    <tr 
                        key={property.id} 
                        className="group transition-all hover:bg-secondary/20"
                    >
                        {/* Title Column */}
                        <td className="px-6 py-4">
                            <div className="flex items-start gap-4">
                                <div className="size-11 rounded-xl bg-secondary/50 border border-border/10 flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <Home className="size-5 opacity-70" />
                                </div>
                                <div className="flex flex-col gap-1.5 min-w-0">
                                    <a 
                                        href={property.viewLink}
                                      className="font-semibold text-foreground hover:text-primary transition-colors truncate block max-w-50"
                                        title={property.title}
                                    >
                                        {property.title}
                                    </a>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground/80">
                                        <span className="font-mono bg-secondary/50 px-1.5 py-0.5 rounded text-[9px] border border-border/20">#{property.id}</span>
                                        <span className="w-px h-2.5 bg-border/60"></span>
                                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30">
                                            {property.dealType}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </td>

                        {/* Location */}
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                                <MapPin className="size-4 opacity-50" />
                                <span className="font-medium">{property.city}</span>
                           </div>
                        </td>

                        {/* Type */}
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                                <Tag className="size-4 opacity-50 text-muted-foreground" />
                                <span className="text-foreground/90">{property.propertyType}</span>
                            </div>
                        </td>

                        {/* Price */}
                        <td className="px-6 py-4">
                           <div className="flex items-center justify-end gap-1.5 font-bold text-foreground">
                                <span className="text-lg tracking-tight dir-ltr">{property.price.replace(/\D/g, '')}</span>
                                <span className="text-[10px] text-muted-foreground font-normal">میلیون</span>
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
                                <a 
                                    href={property.viewLink} 
                                    className="h-8 px-3 rounded-lg bg-background border border-border hover:border-primary/50 hover:bg-primary/5 hover:text-primary text-muted-foreground transition-all flex items-center gap-1.5 text-xs font-medium shadow-sm hover:shadow-md active:scale-95"
                                >
                                    <span>مشاهده</span>
                                    <ArrowUpRight className="size-3" />
                                </a>
                             </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 h-64 items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/5 text-muted-foreground w-full">
             <div className="size-20 rounded-full bg-secondary/50 flex items-center justify-center mb-2">
                 <Search className="size-10 opacity-20" />
             </div>
             <p className="text-base font-medium text-foreground/60">نتیجه‌ای یافت نشد!</p>
             <p className="text-sm opacity-60">لطفا با کلمات کلیدی دیگری جستجو کنید.</p>
          </div>
        )}

        <div className="flex justify-center border-t border-border/40 pt-6">
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
    // Just a placeholder for style mapping
    const styles: Record<string, string> = {
        "فعال": "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-900/50 dark:text-emerald-400",
        "در انتظار": "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900/50 dark:text-amber-400",
        "غیرفعال": "bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-800 dark:text-slate-400",
    };

    const style = styles[status] || styles["غیرفعال"];

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border ${style}`}>
            <span className={`size-1.5 rounded-full mr-1.5 ${status === "فعال" ? "bg-emerald-500" : status === "در انتظار" ? "bg-amber-500" : "bg-slate-500 animate-pulse"}`}></span>
            {status}
        </span>
    )
}
