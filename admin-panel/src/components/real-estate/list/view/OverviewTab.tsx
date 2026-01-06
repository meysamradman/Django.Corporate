import { useState } from "react";
import { TabsContent } from "@/components/elements/Tabs";
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
  MapPin,
  Home,
  Info,
  Loader2,
  Activity,
  Eye,
  Heart,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/elements/Button";
import { realEstateApi } from "@/api/real-estate";
import { mediaService } from "@/components/media/services";
import { PropertyFeatures } from "./PropertyFeatures";

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

export function OverviewTab({ property }: OverviewTabProps) {
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

  const labelsCount = property.labels?.length || 0;
  const tagsCount = property.tags?.length || 0;

  // State for floor plan images (lazy loaded)
  const [floorPlanImages, setFloorPlanImages] = useState<Record<number, FloorPlanImage[]>>({});
  const [loadingImages, setLoadingImages] = useState<Record<number, boolean>>({});

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return "-";
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  const loadFloorPlanImages = async (floorPlanId: number) => {
    // If already loaded, don't load again
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
    <TabsContent value="overview" className="mt-0 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CardWithIcon
          icon={Tag}
          title="برچسب‌ها"
          iconBgColor="bg-indigo"
          iconColor="stroke-indigo-2"
          borderColor="border-b-indigo-1"
          headerClassName="pb-3"
          titleExtra={<Badge variant="indigo">{labelsCount} مورد</Badge>}
        >
          <p className="text-font-s mb-4">
            برچسب‌های مرتبط با این ملک
          </p>
          {property.labels && property.labels.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {property.labels.map((label) => (
                <Badge
                  key={label.id}
                  variant="indigo"
                  className="cursor-default"
                >
                  <Tag className="w-3 h-3 me-1" />
                  {label.title}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-font-s">
              برچسبی انتخاب نشده است
            </p>
          )}
        </CardWithIcon>

        <CardWithIcon
          icon={Tag}
          title="تگ‌ها"
          iconBgColor="bg-purple"
          iconColor="stroke-purple-2"
          borderColor="border-b-purple-1"
          headerClassName="pb-3"
          titleExtra={<Badge variant="purple">{tagsCount} مورد</Badge>}
        >
          <p className="text-font-s mb-4">
            تگ‌های مرتبط با این ملک
          </p>
          {property.tags && property.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {property.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="purple"
                  className="cursor-default"
                >
                  <Tag className="w-3 h-3 me-1" />
                  {tag.title}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-font-s">
              تگی انتخاب نشده است
            </p>
          )}
        </CardWithIcon>

        <CardWithIcon
          icon={Activity}
          title="آمار و وضعیت"
          iconBgColor="bg-teal"
          iconColor="stroke-teal-2"
          borderColor="border-b-teal-1"
          headerClassName="pb-3"
          titleExtra={<Badge variant="teal">فعال</Badge>}
        >
          <p className="text-font-s mb-4">
            آمار بازدید و تعامل کاربران
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded-lg bg-bg-2/50 hover:bg-bg-2 transition-colors border border-br/50">
              <div className="flex items-center gap-2 text-font-s">
                <Activity className="w-4 h-4 text-teal-2" />
                <span>وضعیت فرآیند</span>
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

            <div className="flex items-center justify-between p-2 rounded-lg bg-bg-2/50 hover:bg-bg-2 transition-colors">
              <div className="flex items-center gap-2 text-font-s">
                <Eye className="w-4 h-4 text-gray-2" />
                <span>بازدیدها</span>
              </div>
              <span className="font-medium text-font-p">{property.views_count || 0}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-bg-2/50 hover:bg-bg-2 transition-colors">
              <div className="flex items-center gap-2 text-font-s">
                <Heart className="w-4 h-4 text-red-1" />
                <span>علاقه‌مندی‌ها</span>
              </div>
              <span className="font-medium text-font-p">{property.favorites_count || 0}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-bg-2/50 hover:bg-bg-2 transition-colors">
              <div className="flex items-center gap-2 text-font-s">
                <MessageCircle className="w-4 h-4 text-blue-1" />
                <span>درخواست‌ها</span>
              </div>
              <span className="font-medium text-font-p">{property.inquiries_count || 0}</span>
            </div>
          </div>
        </CardWithIcon>

        <CardWithIcon
          icon={ImageIcon}
          title="مدیا"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
          headerClassName="pb-3"
          titleExtra={<Badge variant="blue">{property.media_count || 0} مورد</Badge>}
          className="md:col-span-3"
        >
          <p className="text-font-s mb-4">
            تعداد کل رسانه‌های آپلود شده
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-2 bg-blue rounded">
              <ImageIcon className="w-4 h-4 stroke-blue-2" />
              <span>{imagesCount} تصویر</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-purple rounded">
              <Video className="w-4 h-4 stroke-purple-2" />
              <span>{videosCount} ویدیو</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-pink rounded">
              <Music className="w-4 h-4 stroke-pink-2" />
              <span>{audiosCount} صدا</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray rounded">
              <FileText className="w-4 h-4 stroke-gray-2" />
              <span>{documentsCount} سند</span>
            </div>
          </div>
        </CardWithIcon>
      </div>

      {/* Details Section - Two Column Layout */}
      <CardWithIcon
        icon={Info}
        title="جزئیات"
        iconBgColor="bg-blue"
        iconColor="stroke-blue-2"
        borderColor="border-b-blue-1"
        contentClassName="space-y-0"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1 */}
          <div className="space-y-4">
            {property.property_type && (
              <div className="flex justify-between items-start border-b pb-3">
                <span className="text-font-s text-gray-2 font-medium">نوع ملک:</span>
                <span className="text-font-p text-right">{property.property_type.title || "-"}</span>
              </div>
            )}
            {property.built_area && (
              <div className="flex justify-between items-start border-b pb-3">
                <span className="text-font-s text-gray-2 font-medium">متراژ:</span>
                <span className="text-font-p text-right">{formatPrice(property.built_area)} متر مربع</span>
              </div>
            )}
            {property.bathrooms !== null && property.bathrooms !== undefined && (
              <div className="flex justify-between items-start border-b pb-3">
                <span className="text-font-s text-gray-2 font-medium">سرویس/حمام:</span>
                <span className="text-font-p text-right">{property.bathrooms === 0 ? 'ندارد' : `${property.bathrooms} عدد`}</span>
              </div>
            )}
            {property.parking_spaces !== null && property.parking_spaces !== undefined && (
              <div className="flex justify-between items-start border-b pb-3">
                <span className="text-font-s text-gray-2 font-medium">پارکینگ:</span>
                <span className="text-font-p text-right">{property.parking_spaces === 0 ? 'ندارد' : `${property.parking_spaces} عدد`}</span>
              </div>
            )}
            {property.year_built && (
              <div className="flex justify-between items-start border-b pb-3">
                <span className="text-font-s text-gray-2 font-medium">سال ساخت:</span>
                <span className="text-font-p text-right">{property.year_built}</span>
              </div>
            )}
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            {property.price && (
              <div className="flex justify-between items-start border-b pb-3">
                <span className="text-font-s text-gray-2 font-medium">قیمت:</span>
                <span className="text-font-p text-right font-medium">{formatPrice(property.price)} {property.currency || 'تومان'}</span>
              </div>
            )}
            {property.bedrooms !== null && property.bedrooms !== undefined && (
              <div className="flex justify-between items-start border-b pb-3">
                <span className="text-font-s text-gray-2 font-medium">خواب:</span>
                <span className="text-font-p text-right">{property.bedrooms === 0 ? 'استودیو' : `${property.bedrooms} اتاق`}</span>
              </div>
            )}
          </div>

          {/* Column 3 */}
          <div className="space-y-4">
            {property.land_area && (
              <div className="flex justify-between items-start border-b pb-3">
                <span className="text-font-s text-gray-2 font-medium">متراژ زمین:</span>
                <span className="text-font-p text-right">{formatPrice(property.land_area)} متر مربع</span>
              </div>
            )}
          </div>
        </div>
      </CardWithIcon>

      {/* Additional Details Section */}

      {/* Address Section with Google Maps */}
      {(property.address || property.city_name || property.province_name || property.postal_code || property.neighborhood) && (
        <CardWithIcon
          icon={MapPin}
          title="آدرس"
          iconBgColor="bg-emerald"
          iconColor="stroke-emerald-2"
          borderColor="border-b-emerald-1"
          contentClassName="space-y-3"
          titleExtra={
            (property.latitude && property.longitude) ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const url = `https://www.google.com/maps?q=${property.latitude},${property.longitude}`;
                  window.open(url, '_blank');
                }}
                className="flex items-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                باز کردن در Google Maps
              </Button>
            ) : undefined
          }
        >
          <div className="space-y-3">
            {property.address && (
              <div className="flex justify-between items-start border-b pb-3">
                <span className="text-font-s text-gray-2 font-medium">آدرس:</span>
                <span className="text-font-p text-right">{property.address}</span>
              </div>
            )}
            {property.city_name && (
              <div className="flex justify-between items-start border-b pb-3">
                <span className="text-font-s text-gray-2 font-medium">شهر:</span>
                <span className="text-font-p text-right">{property.city_name}</span>
              </div>
            )}
            {property.province_name && (
              <div className="flex justify-between items-start border-b pb-3">
                <span className="text-font-s text-gray-2 font-medium">استان/شهرستان:</span>
                <span className="text-font-p text-right">{property.province_name}</span>
              </div>
            )}
            {property.postal_code && (
              <div className="flex justify-between items-start border-b pb-3">
                <span className="text-font-s text-gray-2 font-medium">کد پستی:</span>
                <span className="text-font-p text-right">{property.postal_code}</span>
              </div>
            )}
            {property.neighborhood && (
              <div className="flex justify-between items-start border-b pb-3">
                <span className="text-font-s text-gray-2 font-medium">محله:</span>
                <span className="text-font-p text-right">{property.neighborhood}</span>
              </div>
            )}
            {property.district_name && (
              <div className="flex justify-between items-start border-b pb-3">
                <span className="text-font-s text-gray-2 font-medium">منطقه:</span>
                <span className="text-font-p text-right">{property.district_name}</span>
              </div>
            )}
          </div>
        </CardWithIcon>
      )}

      {/* Features Section - Separated as requested */}
      <PropertyFeatures property={property} />

      {/* Floor Plans Section */}
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
              // Load images when accordion opens
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
                        <Home className="w-5 h-5 text-orange-2 flex-shrink-0" />
                        <div className="flex flex-col items-start gap-1">
                          <h4 className="text-font-p font-semibold text-right">{floorPlan.title}</h4>
                          <div className="flex flex-wrap items-center gap-4 text-font-s text-gray-2">
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
                              <span className="text-font-p font-medium text-gray-1">
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
                      {/* Description */}
                      {floorPlan.description && (
                        <div className="text-font-s text-gray-2 bg-bg/50 rounded-lg p-4">
                          <p className="text-justify leading-relaxed">{floorPlan.description}</p>
                        </div>
                      )}

                      {/* Images */}
                      {(images.length > 0 || isLoading || (floorPlan.main_image && (floorPlan.main_image.file_url || floorPlan.main_image.url))) && (
                        <div className="space-y-3">
                          <h5 className="text-font-s font-medium text-gray-1">تصاویر پلان:</h5>

                          {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="w-6 h-6 animate-spin text-gray-2" />
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

                      {/* Additional Info */}
                      {(floorPlan.floor_number !== null && floorPlan.floor_number !== undefined) || floorPlan.unit_type ? (
                        <div className="flex flex-wrap gap-4 text-font-s text-gray-2 pt-2 border-t">
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
    </TabsContent>
  );
}

