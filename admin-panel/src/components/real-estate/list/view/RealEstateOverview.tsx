import { useState } from "react";

import { CardWithIcon } from "@/components/elements/CardWithIcon";
import type { Property } from "@/types/real_estate/realEstate";
import { Badge } from "@/components/elements/Badge";
import { ReadMore } from "@/components/elements/ReadMore";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/elements/Accordion";
import {
  Tag,
  Image as ImageIcon,
  Video,
  Music,
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
  DollarSign
} from "lucide-react";
import { realEstateApi } from "@/api/real-estate";
import { mediaService } from "@/components/media/services";
import { RealEstateFeatures } from "./RealEstateFeatures.tsx";

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

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return "-";
    return new Intl.NumberFormat('fa-IR').format(price);
  };

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
    <div className="mt-0 space-y-6">

      {/* 1. KEY DETAILS (Moved to Top as requested) */}
      <CardWithIcon
        icon={Info}
        title="جزئیات و مشخصات ملک"
        iconBgColor="bg-blue"
        iconColor="stroke-blue-2"
        borderColor="border-b-blue-1"
        contentClassName="space-y-0"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            {property.property_type && (
              <div className="flex justify-between items-center border-b border-br/50 pb-3">
                <div className="flex items-center gap-2 text-font-s">
                  <Home className="w-4 h-4 text-blue-1" />
                  <span className="font-medium">نوع ملک:</span>
                </div>
                <span className="text-font-p font-semibold">{property.property_type.title || "-"}</span>
              </div>
            )}
            {property.built_area && (
              <div className="flex justify-between items-center border-b border-br/50 pb-3">
                <div className="flex items-center gap-2 text-font-s">
                  <Layers className="w-4 h-4 text-blue-1" />
                  <span className="font-medium">متراژ بنا:</span>
                </div>
                <span className="text-font-p font-semibold" dir="ltr">{formatPrice(property.built_area)} متر مربع</span>
              </div>
            )}
            {property.land_area && (
              <div className="flex justify-between items-center border-b border-br/50 pb-3">
                <div className="flex items-center gap-2 text-font-s">
                  <Layers className="w-4 h-4 text-green-1" />
                  <span className="font-medium">متراژ زمین:</span>
                </div>
                <span className="text-font-p font-semibold" dir="ltr">{formatPrice(property.land_area)} متر مربع</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {property.price && (
              <div className="flex justify-between items-center border-b border-br/50 pb-3">
                <div className="flex items-center gap-2 text-font-s">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium">قیمت کل:</span>
                </div>
                <span className="text-emerald-600 font-bold">{formatPrice(property.price)} {property.currency || 'تومان'}</span>
              </div>
            )}
            {property.bedrooms !== null && property.bedrooms !== undefined && (
              <div className="flex justify-between items-center border-b border-br/50 pb-3">
                <div className="flex items-center gap-2 text-font-s">
                  <Building2 className="w-4 h-4 text-purple-1" />
                  <span className="font-medium">تعداد اتاق خواب:</span>
                </div>
                <span className="text-font-p font-semibold">{property.bedrooms === 0 ? 'استودیو' : `${property.bedrooms} باب`}</span>
              </div>
            )}
            {property.bathrooms !== null && property.bathrooms !== undefined && (
              <div className="flex justify-between items-center border-b border-br/50 pb-3">
                <div className="flex items-center gap-2 text-font-s">
                  <Building2 className="w-4 h-4 text-cyan-1" />
                  <span className="font-medium">سرویس بهداشتی:</span>
                </div>
                <span className="text-font-p font-semibold">{property.bathrooms === 0 ? 'ندارد' : `${property.bathrooms} باب`}</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {property.year_built && (
              <div className="flex justify-between items-center border-b border-br/50 pb-3">
                <div className="flex items-center gap-2 text-font-s">
                  <Calendar className="w-4 h-4 text-orange-1" />
                  <span className="font-medium">سال ساخت:</span>
                </div>
                <span className="text-font-p font-semibold">{property.year_built}</span>
              </div>
            )}
            {property.parking_spaces !== null && property.parking_spaces !== undefined && (
              <div className="flex justify-between items-center border-b border-br/50 pb-3">
                <div className="flex items-center gap-2 text-font-s">
                  <Home className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">پارکینگ:</span>
                </div>
                <span className="text-font-p font-semibold">{property.parking_spaces === 0 ? 'ندارد' : `${property.parking_spaces} جای پارک`}</span>
              </div>
            )}
          </div>
        </div>
      </CardWithIcon>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 2. STATS & STATUS (Kept but simplified) */}
        <CardWithIcon
          icon={Activity}
          title="آمار و وضعیت"
          iconBgColor="bg-teal"
          iconColor="stroke-teal-2"
          borderColor="border-b-teal-1"
          headerClassName="pb-3"
          titleExtra={
            (() => {
              const statusMap: Record<string, { label: string; variant: any }> = {
                active: { label: "فعال", variant: "green" },
                pending: { label: "در حال معامله", variant: "yellow" },
                sold: { label: "فروخته شده", variant: "red" },
                rented: { label: "اجاره داده شده", variant: "blue" },
                archived: { label: "بایگانی شده", variant: "gray" },
              };
              const config = statusMap[property.status] || { label: property.status, variant: "gray" };
              return <Badge variant={config.variant}>{config.label}</Badge>;
            })()
          }
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded-lg bg-bg-2/50 hover:bg-bg-2 transition-colors border-b border-br/50 last:border-0">
              <div className="flex items-center gap-2 text-font-s">
                <Eye className="w-4 h-4 text-gray-2" />
                <span>تعداد بازدیدها</span>
              </div>
              <span className="font-bold text-font-p">{property.views_count || 0}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-bg-2/50 hover:bg-bg-2 transition-colors border-b border-br/50 last:border-0">
              <div className="flex items-center gap-2 text-font-s">
                <Heart className="w-4 h-4 text-red-1" />
                <span>علاقه‌مندی‌ها</span>
              </div>
              <span className="font-bold text-font-p">{property.favorites_count || 0}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-bg-2/50 hover:bg-bg-2 transition-colors border-b border-br/50 last:border-0">
              <div className="flex items-center gap-2 text-font-s">
                <MessageCircle className="w-4 h-4 text-blue-1" />
                <span>درخواست‌ها</span>
              </div>
              <span className="font-bold text-font-p">{property.inquiries_count || 0}</span>
            </div>
          </div>
        </CardWithIcon>

        {/* 3. MEDIA SUMMARY */}
        <CardWithIcon
          icon={ImageIcon}
          title="خلاصه رسانه‌ها"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
          headerClassName="pb-3"
          titleExtra={<Badge variant="blue">{property.media_count || 0} فایل</Badge>}
        >
          <div className="grid grid-cols-2 gap-3 h-full content-start">
            <div className="flex items-center justify-between p-2.5 bg-blue-0/10 rounded-lg border border-blue-1/10">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">تصویر</span>
              </div>
              <span className="font-bold text-blue-700">{imagesCount}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-purple-0/10 rounded-lg border border-purple-1/10">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium text-purple-700">ویدیو</span>
              </div>
              <span className="font-bold text-purple-700">{videosCount}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-pink-0/10 rounded-lg border border-pink-1/10">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-pink-600" />
                <span className="text-xs font-medium text-pink-700">صدا</span>
              </div>
              <span className="font-bold text-pink-700">{audiosCount}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-gray-100 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-600" />
                <span className="text-xs font-medium text-gray-700">سند</span>
              </div>
              <span className="font-bold text-gray-700">{documentsCount}</span>
            </div>
          </div>
        </CardWithIcon>
      </div>

      {/* 4. FEATURES, FLOOR PLANS, DESCRIPTION (As before) */}

      <RealEstateFeatures property={property} />

      {property.floor_plans && property.floor_plans.length > 0 && (
        <CardWithIcon
          icon={Home}
          title="پلان طبقات"
          iconBgColor="bg-orange"
          iconColor="stroke-orange-2"
          borderColor="border-b-orange-1"
          contentClassName="space-y-0"
        >
          <Accordion
            type="single"
            collapsible
            className="w-full"
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
                <AccordionItem key={floorPlan.id} value={`floor-plan-${floorPlan.id}`} className="border-b last:border-b-0">
                  <AccordionTrigger className="py-4 hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3 flex-1">
                        <Home className="w-5 h-5 text-orange-2 shrink-0" />
                        <div className="flex flex-col items-start gap-1">
                          <h4 className="text-font-p font-semibold text-right">{floorPlan.title}</h4>
                          <div className="flex flex-wrap items-center gap-4 text-font-s">
                            <span>اندازه: {typeof floorPlan.floor_size === 'number' ? floorPlan.floor_size.toFixed(2) : floorPlan.floor_size} {floorPlan.size_unit === 'sqft' ? 'فوت مربع' : 'متر مربع'}</span>
                            {floorPlan.bedrooms !== null && floorPlan.bedrooms !== undefined && (
                              <span className="flex items-center gap-1">
                                <Building2 className="w-4 h-4" />
                                {floorPlan.bedrooms} خواب
                              </span>
                            )}
                            {floorPlan.bathrooms !== null && floorPlan.bathrooms !== undefined && (
                              <span className="flex items-center gap-1">
                                <Building2 className="w-4 h-4" />
                                {floorPlan.bathrooms} حمام
                              </span>
                            )}
                            {floorPlan.price && (
                              <span className="text-font-p font-medium">
                                قیمت: {formatPrice(floorPlan.price)} {floorPlan.currency || 'IRR'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-0 pb-4 pr-4">
                    <div className="space-y-4">
                      {floorPlan.description && (
                        <div className="text-font-s bg-bg/50 rounded-lg p-4">
                          <p className="text-justify leading-relaxed">{floorPlan.description}</p>
                        </div>
                      )}

                      {(images.length > 0 || isLoading || (floorPlan.main_image && (floorPlan.main_image.file_url || floorPlan.main_image.url))) && (
                        <div className="space-y-3">
                          <h5 className="text-font-s font-medium ">تصاویر پلان:</h5>

                          {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="text-font-s w-6 h-6 animate-spin" />
                            </div>
                          ) : images.length > 0 ? (
                            <div className="space-y-4">
                              {images.map((imageItem, index) => {
                                const imageUrl = imageItem.image?.file_url || imageItem.image?.url;
                                const fullImageUrl = imageUrl ? mediaService.getMediaUrlFromObject({ file_url: imageUrl } as any) : null;

                                return (
                                  <div key={imageItem.id} className="space-y-2">
                                    {fullImageUrl && (
                                      <div className="rounded-lg overflow-hidden border bg-bg-2 relative w-full">
                                        <img
                                          src={fullImageUrl}
                                          alt={imageItem.image?.alt_text || imageItem.title || floorPlan.title}
                                          className="w-full h-auto object-contain"
                                          loading={index === 0 ? "eager" : "lazy"}
                                        />
                                        {imageItem.is_main && (
                                          <div className="absolute top-2 left-2">
                                            <Badge variant="orange" className="text-xs">تصویر اصلی</Badge>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    {imageItem.title && (
                                      <p className="text-font-xs text-gray-2 text-center">{imageItem.title}</p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : floorPlan.main_image && (floorPlan.main_image.file_url || floorPlan.main_image.url) ? (
                            <div className="rounded-lg overflow-hidden border bg-bg-2 w-full">
                              <img
                                src={mediaService.getMediaUrlFromObject(floorPlan.main_image as any)}
                                alt={floorPlan.main_image.alt_text || floorPlan.title}
                                className="w-full h-auto object-contain"
                                loading="lazy"
                              />
                            </div>
                          ) : null}
                        </div>
                      )}

                      {(floorPlan.floor_number !== null && floorPlan.floor_number !== undefined) || floorPlan.unit_type ? (
                        <div className="flex flex-wrap gap-4 text-font-s pt-2 border-t">
                          {floorPlan.floor_number !== null && floorPlan.floor_number !== undefined && (
                            <span>طبقه: {floorPlan.floor_number}</span>
                          )}
                          {floorPlan.unit_type && (
                            <span>نوع واحد: {floorPlan.unit_type}</span>
                          )}
                          {floorPlan.is_available === false && (
                            <span className="text-red-1">در دسترس نیست</span>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardWithIcon>
      )}

      <CardWithIcon
        icon={FileText}
        title="توضیحات"
        iconBgColor="bg-blue"
        iconColor="stroke-blue-2"
        borderColor="border-b-blue-1"
        contentClassName="space-y-6"
      >
        <div>
          <label className="text-font-s mb-3 block">
            توضیحات کوتاه
          </label>
          <div className="text-font-p leading-relaxed p-4 bg-bg/50 rounded-lg" style={{ textAlign: 'justify' }}>
            {property.short_description || (
              <span className="text-font-s">
                توضیحی وارد نشده است
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="text-font-s mb-3 block">
            توضیحات کامل
          </label>
          <div className="p-4 bg-bg/50 rounded-lg" style={{ textAlign: 'justify' }}>
            {property.description ? (
              <ReadMore
                content={property.description}
                isHTML={true}
                maxHeight="200px"
              />
            ) : (
              <span className="text-font-s">
                توضیحی وارد نشده است
              </span>
            )}
          </div>
        </div>
      </CardWithIcon>
    </div>
  );
}
