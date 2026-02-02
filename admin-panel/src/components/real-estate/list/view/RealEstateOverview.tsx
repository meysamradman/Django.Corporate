
import { useState } from "react";
import type { Property } from "@/types/real_estate/realEstate";
import { Badge } from "@/components/elements/Badge";
import { ReadMore } from "@/components/elements/ReadMore";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/elements/Accordion";
import {
  FileText,
  Building2,
  Home,
  Info,
  Loader2,
  Activity,
  Eye,
  Heart,
  MessageCircle,
  Layers,
  Calendar,
  DollarSign,
  ImageIcon,
  Video,
  Music
} from "lucide-react";
import { realEstateApi } from "@/api/real-estate";
import { mediaService } from "@/components/media/services";
import { Card } from "@/components/elements/Card";
import { formatNumber } from "@/core/utils/commonFormat";
import { formatArea, formatPriceToPersian } from "@/core/utils/realEstateFormat";

interface OverviewTabProps {
  property: Property;
}

interface FloorPlanImage {
  id: number;
  image: {
    id: number;
    url?: string;
    file_url?: string;
    title: string;
    alt_text: string;
  };
  is_main: boolean;
  order: number;
  title?: string;
}

export function RealEstateOverview({ property }: OverviewTabProps) {
  const allMedia = property.media || property.property_media || [];
  const imagesCount = allMedia.filter(
    (item: any) => (item.media_detail || item.media)?.media_type === "image"
  ).length;
  const videosCount = allMedia.filter(
    (item: any) => (item.media_detail || item.media)?.media_type === "video"
  ).length;
  const audiosCount = allMedia.filter(
    (item: any) => (item.media_detail || item.media)?.media_type === "audio"
  ).length;
  const documentsCount = allMedia.filter(
    (item: any) => {
      const media = item.media_detail || item.media;
      return media?.media_type === "document" || media?.media_type === "pdf";
    }
  ).length;

  const [floorPlanImages, setFloorPlanImages] = useState<Record<number, FloorPlanImage[]>>({});
  const [loadingImages, setLoadingImages] = useState<Record<number, boolean>>({});



  const loadFloorPlanImages = async (floorPlanId: number) => {
    if (floorPlanImages[floorPlanId]) return;

    try {
      setLoadingImages(prev => ({ ...prev, [floorPlanId]: true }));
      const floorPlanDetail = await realEstateApi.getFloorPlanById(floorPlanId);
      if (floorPlanDetail && floorPlanDetail.images) {
        setFloorPlanImages(prev => ({
          ...prev,
          [floorPlanId]: floorPlanDetail.images || []
        }));
      }
    } catch (error) {
    } finally {
      setLoadingImages(prev => ({ ...prev, [floorPlanId]: false }));
    }
  };

  return (
    <div className="space-y-8">

      <Card className="p-6 shadow-sm block">
        <div className="flex items-center gap-3 mb-6 border-b border-br pb-4">
          <div className="p-2 rounded-lg bg-blue-0/50 text-blue-1">
            <Info className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-font-p">جزئیات و مشخصات ملک</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            {property.property_type && (
              <div className="flex justify-between items-center group">
                <div className="flex items-center gap-2 text-font-s">
                  <Home className="w-4 h-4 text-blue-1/70" />
                  <span className="text-sm">نوع ملک:</span>
                </div>
                <span className="text-sm font-bold text-font-p">{property.property_type.title || "-"}</span>
              </div>
            )}
            {property.built_area && (
              <div className="flex justify-between items-center group">
                <div className="flex items-center gap-2 text-font-s">
                  <Layers className="w-4 h-4 text-blue-1/70" />
                  <span className="text-sm">متراژ بنا:</span>
                </div>
                <span className="text-sm font-bold text-font-p">{formatArea(property.built_area)}</span>
              </div>
            )}
            {property.land_area && (
              <div className="flex justify-between items-center group">
                <div className="flex items-center gap-2 text-font-s">
                  <Layers className="w-4 h-4 text-emerald-1/70" />
                  <span className="text-sm">متراژ زمین:</span>
                </div>
                <span className="text-sm font-bold text-font-p">{formatArea(property.land_area)}</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center group">
              <div className="flex items-center gap-2 text-font-s">
                <DollarSign className="w-4 h-4 text-emerald-1/70" />
                <span className="text-sm">قیمت کل:</span>
              </div>
              <span className="text-sm font-bold text-emerald-1">
                {formatPriceToPersian(property.price, property.currency || 'تومان')}
              </span>
            </div>
            {property.bedrooms !== null && property.bedrooms !== undefined && (
              <div className="flex justify-between items-center group">
                <div className="flex items-center gap-2 text-font-s">
                  <Building2 className="w-4 h-4 text-purple-1/70" />
                  <span className="text-sm">تعداد اتاق خواب:</span>
                </div>
                <span className="text-sm font-bold text-font-p">{property.bedrooms === 0 ? 'استودیو' : `${property.bedrooms?.toLocaleString('en-US')} باب`}</span>
              </div>
            )}
            {property.bathrooms !== null && property.bathrooms !== undefined && (
              <div className="flex justify-between items-center group">
                <div className="flex items-center gap-2 text-font-s">
                  <Building2 className="w-4 h-4 text-cyan-1/70" />
                  <span className="text-sm">سرویس بهداشتی:</span>
                </div>
                <span className="text-sm font-bold text-font-p">{property.bathrooms === 0 ? 'ندارد' : `${property.bathrooms?.toLocaleString('en-US')} باب`}</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {property.year_built && (
              <div className="flex justify-between items-center group">
                <div className="flex items-center gap-2 text-font-s">
                  <Calendar className="w-4 h-4 text-orange-1/70" />
                  <span className="text-sm">سال ساخت:</span>
                </div>
                <span className="text-sm font-bold text-font-p">{property.year_built?.toLocaleString('en-US').replace(/,/g, '')}</span>
              </div>
            )}
            {property.parking_spaces !== null && property.parking_spaces !== undefined && (
              <div className="flex justify-between items-center group">
                <div className="flex items-center gap-2 text-font-s">
                  <Home className="w-4 h-4 text-gray-1" />
                  <span className="text-sm">پارکینگ:</span>
                </div>
                <span className="text-sm font-bold text-font-p">{property.parking_spaces === 0 ? 'ندارد' : `${property.parking_spaces?.toLocaleString('en-US')} جای پارک`}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 shadow-sm block">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-0/50 text-teal-1">
                <Activity className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-font-p">آمار و وضعیت</h2>
            </div>
            {(() => {
              const statusMap: Record<string, { label: string; variant: any }> = {
                active: { label: "فعال", variant: "green" },
                pending: { label: "در حال معامله", variant: "yellow" },
                sold: { label: "فروخته شده", variant: "red" },
                rented: { label: "اجاره داده شده", variant: "blue" },
                archived: { label: "بایگانی شده", variant: "gray" },
              };
              const config = statusMap[property.status] || { label: property.status, variant: "gray" };
              return <Badge variant={config.variant}>{config.label}</Badge>;
            })()}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-bg border border-br/50 flex flex-col items-center gap-2">
              <Eye className="w-5 h-5 text-font-s opacity-70" />
              <span className="text-lg font-bold text-font-p">{property.views_count || 0}</span>
              <span className="text-[10px] font-bold text-font-s uppercase tracking-wider">بازدید</span>
            </div>
            <div className="p-4 rounded-xl bg-bg border border-br/50 flex flex-col items-center gap-2">
              <Heart className="w-5 h-5 text-red-1 opacity-70" />
              <span className="text-lg font-bold text-font-p">{property.favorites_count || 0}</span>
              <span className="text-[10px] font-bold text-font-s uppercase tracking-wider">علاقه‌مندی</span>
            </div>
            <div className="p-4 rounded-xl bg-bg border border-br/50 flex flex-col items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-1 opacity-70" />
              <span className="text-lg font-bold text-font-p">{property.inquiries_count || 0}</span>
              <span className="text-[10px] font-bold text-font-s uppercase tracking-wider">درخواست</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-sm block">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-0/50 text-blue-1">
                <ImageIcon className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-font-p">خلاصه رسانه‌ها</h2>
            </div>
            <Badge variant="blue">{property.media_count || 0} فایل</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 h-full content-start">
            <div className="flex items-center justify-between p-3 bg-bg rounded-xl border border-br/50 group">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-1 opacity-70" />
                <span className="text-xs font-bold text-font-s">تصویر</span>
              </div>
              <span className="font-bold text-font-p">{imagesCount}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-bg rounded-xl border border-br/50 group">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-purple-1 opacity-70" />
                <span className="text-xs font-bold text-font-s">ویدیو</span>
              </div>
              <span className="font-bold text-font-p">{videosCount}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-bg rounded-xl border border-br/50 group">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-pink-1 opacity-70" />
                <span className="text-xs font-bold text-font-s">صدا</span>
              </div>
              <span className="font-bold text-font-p">{audiosCount}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-bg rounded-xl border border-br/50 group">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-1 opacity-70" />
                <span className="text-xs font-bold text-font-s">سند</span>
              </div>
              <span className="font-bold text-font-p">{documentsCount}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 shadow-sm block">
        <div className="flex items-center gap-3 mb-6 border-b border-br pb-4">
          <div className="p-2 rounded-lg bg-orange-0/50 text-orange-1">
            <FileText className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-font-p">توضیحات و جزئیات تکمیلی</h2>
        </div>

        <div className="space-y-8">
          <div>
            <label className="text-[10px] font-bold text-font-s uppercase tracking-wider mb-2 block">
              توضیحات کوتاه
            </label>
            <div className="text-sm text-font-p border-r-2 border-blue-1/30 pr-4 leading-relaxed">
              {property.short_description || "توضیحی وارد نشده است"}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-font-s uppercase tracking-wider mb-2 block">
              توضیحات کامل
            </label>
            <div className="text-sm text-font-p bg-bg/50 rounded-xl p-5 leading-loose">
              {property.description ? (
                <ReadMore content={property.description} isHTML={true} maxHeight="200px" />
              ) : (
                "توضیحی وارد نشده است"
              )}
            </div>
          </div>
        </div>
      </Card>

      {
        property.floor_plans && property.floor_plans.length > 0 && (
          <Card className="p-6 shadow-sm block">
            <div className="flex items-center gap-3 mb-6 border-b border-br pb-4">
              <div className="p-2 rounded-lg bg-indigo-0/50 text-indigo-1">
                <Home className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-font-p">پلان طبقات</h2>
            </div>

            <Accordion
              type="single"
              collapsible
              className="w-full space-y-3"
              onValueChange={(value) => {
                if (value) {
                  const floorPlanId = parseInt(value.replace('floor-plan-', ''));
                  if (floorPlanId && property.floor_plans?.some(fp => fp.id === floorPlanId)) {
                    loadFloorPlanImages(floorPlanId);
                  }
                }
              }}
            >
              {property.floor_plans.map((floorPlan) => {
                const images = floorPlanImages[floorPlan.id] || [];
                const isLoading = loadingImages[floorPlan.id];

                return (
                  <AccordionItem key={floorPlan.id} value={`floor-plan-${floorPlan.id}`} className="border border-br rounded-xl bg-bg px-4 overflow-hidden">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col items-start gap-1">
                          <span className="text-sm font-bold text-font-p">{floorPlan.title}</span>
                          <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-font-s uppercase">
                            <span>{typeof floorPlan.floor_size === 'number' ? formatArea(floorPlan.floor_size) : floorPlan.floor_size}</span>
                            {floorPlan.bedrooms !== null && <span>• {floorPlan.bedrooms} خواب</span>}
                            {floorPlan.bathrooms !== null && <span>• {floorPlan.bathrooms} حمام</span>}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="space-y-4 pt-2 border-t border-br/50">
                        {floorPlan.description && (
                          <p className="text-xs text-font-s leading-relaxed italic">{floorPlan.description}</p>
                        )}

                        {(images.length > 0 || isLoading || (floorPlan.main_image && (floorPlan.main_image.file_url || floorPlan.main_image.url))) && (
                          <div className="rounded-xl overflow-hidden bg-card border border-br">
                            {isLoading ? (
                              <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-blue-1" />
                              </div>
                            ) : images.length > 0 ? (
                              <div className="divide-y divide-br">
                                {images.map((imageItem) => {
                                  const imageUrl = imageItem.image?.file_url || imageItem.image?.url;
                                  const fullImageUrl = imageUrl ? mediaService.getMediaUrlFromObject({ file_url: imageUrl } as any) : null;
                                  return fullImageUrl && (
                                    <div key={imageItem.id} className="p-4 bg-card">
                                      <img src={fullImageUrl} alt={floorPlan.title} className="w-full h-auto rounded-lg" />
                                      {imageItem.title && <p className="mt-2 text-center text-[10px] text-font-s">{imageItem.title}</p>}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : floorPlan.main_image && (
                              <img src={mediaService.getMediaUrlFromObject(floorPlan.main_image as any)} alt={floorPlan.title} className="w-full h-auto" />
                            )}
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </Card>
        )
      }
    </div>
  );
}
