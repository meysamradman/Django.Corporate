import { useMemo } from "react";
import { 
  MapPin, 
  Home, 
  Tag, 
  Search,
  ArrowUpRight
} from "lucide-react";
import { Badge } from "@/components/elements/Badge";
import { Button } from "@/components/elements/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { PaginationControls } from "@/components/shared/paginations/PaginationControls";
import { Skeleton } from "@/components/elements/Skeleton";
import { Loader } from "@/components/elements/Loader";

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
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function ProfilePropertiesList({
  isConsultant,
  properties,
  currentPage,
  totalPages,
  pageSize,
  totalCount,
  isLoading = false,
  onPageChange,
  onPageSizeChange,
}: ProfilePropertiesListProps) {
  const currentItems = useMemo(() => properties, [properties]);

  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalCount);

  return (
    <Card className="gap-0">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center justify-between gap-2">
          <span>{isConsultant ? "لیست املاک و آگهی‌ها" : "لیست املاک ثبت‌شده"}</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-font-s hidden sm:inline-block">تعداد کل:</span>
            <Badge variant="gray">{totalCount}</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">

        {currentItems.length > 0 || isLoading ? (
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
                    {isLoading && currentItems.length === 0 ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <tr key={`loading-${index}`}>
                          <td className="px-6 py-4"><Skeleton className="h-10 w-full" /></td>
                          <td className="px-6 py-4"><Skeleton className="h-8 w-full" /></td>
                          <td className="px-6 py-4"><Skeleton className="h-8 w-full" /></td>
                          <td className="px-6 py-4"><Skeleton className="h-8 w-full" /></td>
                          <td className="px-6 py-4"><Skeleton className="h-8 w-20 mx-auto" /></td>
                          <td className="px-6 py-4"><Skeleton className="h-8 w-20 mr-auto" /></td>
                        </tr>
                      ))
                    ) : (
                      currentItems.map((property) => (
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
                    ))) }
                </tbody>
                </table>
            </div>

            {isLoading && (
              <div className="border-t border-br/40 py-2">
                <Loader />
              </div>
            )}

            {isLoading && currentItems.length > 0 && (
              <div className="border-t border-br/40 p-3">
                <div className="grid grid-cols-3 gap-3">
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-2 w-full" />
                </div>
              </div>
            )}
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
                  onPageChange={onPageChange}
                    pageSize={pageSize}
                  onPageSizeChange={onPageSizeChange}
                  pageSizeOptions={[10, 20, 50]}
                  showPageSize={true}
                    showInfo={true}
                    infoText={`${rangeStart} - ${rangeEnd} از ${totalCount}`}
                    totalCount={totalCount}
                />
             </div>
        </div>
       
        </div>
      </CardContent>
    </Card>
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
