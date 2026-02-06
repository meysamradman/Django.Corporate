
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Layers,
  Calendar,
  Hash,
  Maximize2,
  DollarSign,
  ImageIcon,
  Video,
  Music,
  Users,
  Briefcase,
  Package,
  Soup,
  Globe,
  CreditCard,
  ShieldCheck,
  Smartphone,
  PhoneCall
} from "lucide-react";
import { realEstateApi } from "@/api/real-estate";
import { mediaService } from "@/components/media/services";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { formatArea, formatPriceToPersian } from "@/core/utils/realEstateFormat";
import { msg } from "@/core/messages";
import { Item, ItemContent, ItemMedia } from "@/components/elements/Item";
import { EmptyState } from "@/components/shared/EmptyState";

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

  const { data: fieldOptions } = useQuery({
    queryKey: ["property-field-options"],
    queryFn: () => realEstateApi.getFieldOptions(),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const getLocalizedValue = (field: string, value: any) => {
    if (!fieldOptions || value === null || value === undefined) return value;
    const options = (fieldOptions as any)[field] as [any, string][];
    if (!options) return value;
    const option = options.find(opt => opt[0] === value);
    return option ? option[1] : value;
  };

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
    <div className="flex flex-col gap-6">

      <CardWithIcon
        icon={Info}
        title="جزئیات و مشخصات ملک"
        iconBgColor="bg-blue-0/50"
        iconColor="text-blue-1"
        cardBorderColor="border-b-blue-1"
        className="shadow-sm"
        contentClassName=""
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-0 text-font-p">
          {/* Column 1: Core Identity & Status */}
          <div className="flex flex-col">
            <Item className="py-3 border-b border-br/50 border-x-0 border-t-0 rounded-sm hover:bg-bg/40 transition-colors">
              <ItemMedia className="text-orange-1/60 group-hover:text-orange-1 transition-colors">
                <Activity className="size-4" />
              </ItemMedia>
              <ItemContent className="flex-row items-center justify-start gap-2">
                <span className="text-xs font-bold text-font-s">وضعیت:</span>
                <span className="text-sm font-black">
                  {getLocalizedValue('status', property.status) || (property.status === 'for_rent' ? 'اجاره' : property.status === 'for_sale' ? 'فروش' : property.status || 'وارد نشده')}
                </span>
              </ItemContent>
            </Item>

            <Item className="py-3 border-b border-br/50 border-x-0 border-t-0 rounded-sm hover:bg-bg/40 transition-colors">
              <ItemMedia className="text-blue-1/60 group-hover:text-blue-1 transition-colors">
                <Hash className="size-4" />
              </ItemMedia>
              <ItemContent className="flex-row items-center justify-start gap-2">
                <span className="text-xs font-bold text-font-s">شناسه ملک:</span>
                <span className="text-sm font-black font-mono">HZ-{property.id || 'وارد نشده'}</span>
              </ItemContent>
            </Item>

            <Item className="py-3 border-b border-br/50 border-x-0 border-t-0 rounded-sm hover:bg-bg/40 transition-colors">
              <ItemMedia className="text-blue-1/60 group-hover:text-blue-1 transition-colors">
                <Home className="size-4" />
              </ItemMedia>
              <ItemContent className="flex-row items-center justify-start gap-2">
                <span className="text-xs font-bold text-font-s">نوع ملک:</span>
                <span className="text-sm font-black">{property.property_type?.title || "وارد نشده"}</span>
              </ItemContent>
            </Item>

            <Item className="py-3 border-b border-br/50 border-x-0 border-t-0 rounded-sm hover:bg-bg/40 transition-colors">
              <ItemMedia className="text-blue-1/60 group-hover:text-blue-1 transition-colors">
                <Maximize2 className="size-4" />
              </ItemMedia>
              <ItemContent className="flex-row items-center justify-start gap-2">
                <span className="text-xs font-bold text-font-s">زیربنا:</span>
                <span className="text-sm font-black font-mono" dir="ltr">{property.built_area ? formatArea(property.built_area) : "وارد نشده"}</span>
              </ItemContent>
            </Item>

            <Item className="py-3 border-b border-br/50 border-x-0 border-t-0 rounded-sm hover:bg-bg/40 transition-colors">
              <ItemMedia className="text-emerald-1/60 group-hover:text-emerald-1 transition-colors">
                <Layers className="size-4" />
              </ItemMedia>
              <ItemContent className="flex-row items-center justify-start gap-2">
                <span className="text-xs font-bold text-font-s">مساحت زمین:</span>
                <span className="text-sm font-black font-mono" dir="ltr">{property.land_area ? formatArea(property.land_area) : "وارد نشده"}</span>
              </ItemContent>
            </Item>

            <Item className="py-3 border-b border-br/50 border-x-0 border-t-0 last:border-0 md:last:border-b lg:last:border-0 rounded-sm hover:bg-bg/40 transition-colors">
              <ItemMedia className="text-orange-1/60 group-hover:text-orange-1 transition-colors">
                <Calendar className="size-4" />
              </ItemMedia>
              <ItemContent className="flex-row items-center justify-start gap-2">
                <span className="text-xs font-bold text-font-s">سال ساخت:</span>
                <span className="text-sm font-black">{property.year_built ? property.year_built.toLocaleString('fa-IR', { useGrouping: false }) : "وارد نشده"}</span>
              </ItemContent>
            </Item>
          </div>

          {/* Column 2: Financials & Rooms */}
          <div className="flex flex-col">
            <Item className="py-3 border-b border-br/50 border-x-0 border-t-0 rounded-sm hover:bg-bg/40 transition-colors">
              <ItemMedia className="text-emerald-1/60 group-hover:text-emerald-1 transition-colors">
                <DollarSign className="size-4" />
              </ItemMedia>
              <ItemContent className="flex-row items-center justify-start gap-2">
                <span className="text-xs font-bold text-font-s">قیمت کل / اجاره:</span>
                <span className="text-sm font-black text-emerald-1">
                  {property.price || property.monthly_rent
                    ? formatPriceToPersian(property.price || property.monthly_rent, property.currency || 'تومان')
                    : "وارد نشده"}
                </span>
              </ItemContent>
            </Item>

            <Item className="py-3 border-b border-br/50 border-x-0 border-t-0 rounded-sm hover:bg-bg/40 transition-colors">
              <ItemMedia className="text-blue-1/60 group-hover:text-blue-1 transition-colors">
                <CreditCard className="size-4" />
              </ItemMedia>
              <ItemContent className="flex-row items-center justify-start gap-2">
                <span className="text-xs font-bold text-font-s">رهن / ودیعه:</span>
                <span className="text-sm font-black text-blue-1">
                  {property.mortgage_amount || property.security_deposit
                    ? formatPriceToPersian(property.mortgage_amount || property.security_deposit, property.currency || 'تومان')
                    : "وارد نشده"}
                </span>
              </ItemContent>
            </Item>

            <Item className="py-3 border-b border-br/50 border-x-0 border-t-0 rounded-sm hover:bg-bg/40 transition-colors">
              <ItemMedia className="text-purple-1/60 group-hover:text-purple-1 transition-colors">
                <Building2 className="size-4" />
              </ItemMedia>
              <ItemContent className="flex-row items-center justify-start gap-2">
                <span className="text-xs font-bold text-font-s">تعداد اتاق خواب:</span>
                <span className="text-sm font-black">
                  {property.bedrooms !== null && property.bedrooms !== undefined
                    ? ((msg.realEstate().facilities.bedrooms as any)[property.bedrooms] || property.bedrooms.toLocaleString('fa-IR'))
                    : "وارد نشده"}
                </span>
              </ItemContent>
            </Item>

            <Item className="py-3 border-b border-br/50 border-x-0 border-t-0 rounded-sm hover:bg-bg/40 transition-colors">
              <ItemMedia className="text-cyan-1/60 group-hover:text-cyan-1 transition-colors">
                <Building2 className="size-4" />
              </ItemMedia>
              <ItemContent className="flex-row items-center justify-start gap-2">
                <span className="text-xs font-bold text-font-s">سرویس بهداشتی:</span>
                <span className="text-sm font-black">
                  {property.bathrooms !== null && property.bathrooms !== undefined
                    ? ((msg.realEstate().facilities.bathrooms as any)[property.bathrooms] || (property.bathrooms === 0 ? 'ندارد' : property.bathrooms.toLocaleString('fa-IR')))
                    : "وارد نشده"}
                </span>
              </ItemContent>
            </Item>

            <Item className="py-3 border-b border-br/50 border-x-0 border-t-0 rounded-sm hover:bg-bg/40 transition-colors">
              <ItemMedia className="text-orange-1/60 group-hover:text-orange-1 transition-colors">
                <Soup className="size-4" />
              </ItemMedia>
              <ItemContent className="flex-row items-center justify-start gap-2">
                <span className="text-xs font-bold text-font-s">آشپزخانه:</span>
                <span className="text-sm font-black">
                  {property.kitchens !== null && property.kitchens !== undefined
                    ? ((msg.realEstate().facilities.kitchens as any)[property.kitchens] || property.kitchens.toLocaleString('fa-IR'))
                    : "وارد نشده"}
                </span>
              </ItemContent>
            </Item>

            <Item className="py-3 border-b border-br/50 border-x-0 border-t-0 last:border-0 md:last:border-0 lg:last:border-b rounded-sm hover:bg-bg/40 transition-colors">
              <ItemMedia className="text-indigo-1/60 group-hover:text-indigo-1 transition-colors">
                <Users className="size-4" />
              </ItemMedia>
              <ItemContent className="flex-row items-center justify-start gap-2">
                <span className="text-xs font-bold text-font-s">پذیرایی:</span>
                <span className="text-sm font-black">
                  {property.living_rooms !== null && property.living_rooms !== undefined
                    ? ((msg.realEstate().facilities.living_rooms as any)[property.living_rooms] || property.living_rooms.toLocaleString('fa-IR'))
                    : "وارد نشده"}
                </span>
              </ItemContent>
            </Item>
          </div>

          {/* Column 3: Logistics & Statistics */}
          <div className="flex flex-col">
            <Item className="py-3 border-b border-br/50 border-x-0 border-t-0 rounded-sm hover:bg-bg/40 transition-colors">
              <ItemMedia className="text-gray-1/60 group-hover:text-gray-1 transition-colors">
                <Home className="size-4" />
              </ItemMedia>
              <ItemContent className="flex-row items-center justify-start gap-2">
                <span className="text-xs font-bold text-font-s">پارکینگ:</span>
                <span className="text-sm font-black">
                  {property.parking_spaces !== null && property.parking_spaces !== undefined
                    ? ((msg.realEstate().facilities.parking_spaces as any)[property.parking_spaces] || (property.parking_spaces === 0 ? 'ندارد' : property.parking_spaces.toLocaleString('fa-IR')))
                    : "وارد نشده"}
                </span>
              </ItemContent>
            </Item>

            <Item className="py-3 border-b border-br/50 border-x-0 border-t-0 rounded-sm hover:bg-bg/40 transition-colors">
              <ItemMedia className="text-blue-1/60 group-hover:text-blue-1 transition-colors">
                <Package className="size-4" />
              </ItemMedia>
              <ItemContent className="flex-row items-center justify-start gap-2">
                <span className="text-xs font-bold text-font-s">انباری:</span>
                <span className="text-sm font-black">
                  {property.storage_rooms !== null && property.storage_rooms !== undefined
                    ? ((msg.realEstate().facilities.storage_rooms as any)[property.storage_rooms] || property.storage_rooms.toLocaleString('fa-IR'))
                    : "وارد نشده"}
                </span>
              </ItemContent>
            </Item>

            <Item className="py-3 border-b border-br/50 border-x-0 border-t-0 rounded-sm hover:bg-bg/40 transition-colors">
              <ItemMedia className="text-indigo-1/60 group-hover:text-indigo-1 transition-colors">
                <Layers className="size-4" />
              </ItemMedia>
              <ItemContent className="flex-row items-center justify-start gap-2">
                <span className="text-xs font-bold text-font-s">تعداد کل طبقات:</span>
                <span className="text-sm font-black font-mono">{property.floors_in_building ? property.floors_in_building.toLocaleString('fa-IR') : "وارد نشده"}</span>
              </ItemContent>
            </Item>

            <Item className="py-3 border-b border-br/50 border-x-0 border-t-0 rounded-sm hover:bg-bg/40 transition-colors">
              <ItemMedia className="text-indigo-1/60 group-hover:text-indigo-1 transition-colors">
                <Layers className="size-4" />
              </ItemMedia>
              <ItemContent className="flex-row items-center justify-start gap-2">
                <span className="text-xs font-bold text-font-s">طبقه ملک:</span>
                <span className="text-sm font-black font-mono">
                  {property.floor_number !== null && property.floor_number !== undefined
                    ? ((msg.realEstate().facilities.floor_number as any)[property.floor_number] || property.floor_number.toLocaleString('fa-IR'))
                    : "وارد نشده"}
                </span>
              </ItemContent>
            </Item>

            <Item className="py-3 border-b border-br/50 border-x-0 border-t-0 rounded-sm hover:bg-bg/40 transition-colors">
              <ItemMedia className="text-amber-1/60 group-hover:text-amber-1 transition-colors">
                <Briefcase className="size-4" />
              </ItemMedia>
              <ItemContent className="flex-row items-center justify-start gap-2">
                <span className="text-xs font-bold text-font-s">نوع سند:</span>
                <span className="text-sm font-black">{property.document_type ? (getLocalizedValue('document_type', property.document_type) || property.document_type) : "وارد نشده"}</span>
              </ItemContent>
            </Item>

            <Item className="py-3 border-b border-br/50 border-x-0 border-t-0 last:border-0 rounded-sm hover:bg-bg/40 transition-colors">
              <ItemMedia className="text-emerald-1/60 group-hover:text-emerald-1 transition-colors">
                <ShieldCheck className="size-4" />
              </ItemMedia>
              <ItemContent className="flex-row items-center justify-start gap-2">
                <span className="text-xs font-bold text-font-s">وضعیت سند:</span>
                <span className="text-sm font-black">
                  {property.has_document === true ? 'دارد' : property.has_document === false ? 'ندارد' : 'وارد نشده'}
                </span>
              </ItemContent>
            </Item>
          </div>
        </div>
      </CardWithIcon>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CardWithIcon
          icon={Activity}
          title="آمار و وضعیت"
          iconBgColor="bg-teal-0/50"
          iconColor="text-teal-1"
          cardBorderColor="border-b-teal-1"
          className="shadow-sm"
          contentClassName=""
          showHeaderBorder={false}
          titleExtra={(() => {
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
        >

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl bg-bg border border-br/50 flex flex-col items-center gap-2 group hover:border-blue-1/30 transition-all">
              <Eye className="w-4 h-4 text-blue-1 opacity-70 group-hover:opacity-100 transition-opacity" />
              <span className="text-lg font-black text-font-p">{property.views_count?.toLocaleString('fa-IR') || "۰"}</span>
              <span className="text-[10px] font-bold text-font-s tracking-wider text-center">بازدید کل</span>
            </div>

            <div className="p-4 rounded-xl bg-bg border border-br/50 flex flex-col items-center gap-2 group hover:border-blue-1/30 transition-all">
              <Globe className="w-4 h-4 text-emerald-1 opacity-70 group-hover:opacity-100 transition-opacity" />
              <span className="text-lg font-black text-font-p">{property.web_views_count?.toLocaleString('fa-IR') || "۰"}</span>
              <span className="text-[10px] font-bold text-font-s tracking-wider text-center">بازدید وب</span>
            </div>

            <div className="p-4 rounded-xl bg-bg border border-br/50 flex flex-col items-center gap-2 group hover:border-blue-1/30 transition-all">
              <Smartphone className="w-4 h-4 text-purple-1 opacity-70 group-hover:opacity-100 transition-opacity" />
              <span className="text-lg font-black text-font-p">{property.app_views_count?.toLocaleString('fa-IR') || "۰"}</span>
              <span className="text-[10px] font-bold text-font-s tracking-wider text-center">بازدید اپ</span>
            </div>

            <div className="p-4 rounded-xl bg-bg border border-br/50 flex flex-col items-center gap-2 group hover:border-red-1/30 transition-all">
              <Heart className="w-4 h-4 text-red-1 opacity-70 group-hover:opacity-100 transition-opacity" />
              <span className="text-lg font-black text-font-p">{property.favorites_count?.toLocaleString('fa-IR') || "۰"}</span>
              <span className="text-[10px] font-bold text-font-s tracking-wider text-center">علاقه‌مندی</span>
            </div>

            <div className="p-4 rounded-xl bg-bg border border-br/50 flex flex-col items-center gap-2 group hover:border-orange-1/30 transition-all">
              <PhoneCall className="w-4 h-4 text-orange-1 opacity-70 group-hover:opacity-100 transition-opacity" />
              <span className="text-lg font-black text-font-p">{property.inquiries_count?.toLocaleString('fa-IR') || "۰"}</span>
              <span className="text-[10px] font-bold text-font-s tracking-wider text-center">درخواست/تماس</span>
            </div>
          </div>
        </CardWithIcon>

        <CardWithIcon
          icon={ImageIcon}
          title="خلاصه رسانه‌ها"
          iconBgColor="bg-blue-0/50"
          iconColor="text-blue-1"
          cardBorderColor="border-b-blue-1"
          className="shadow-sm"
          contentClassName=""
          showHeaderBorder={false}
          titleExtra={<Badge variant="blue">{property.media_count || 0} فایل</Badge>}
        >

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
        </CardWithIcon>
      </div>

      <CardWithIcon
        icon={FileText}
        title="توضیحات و جزئیات تکمیلی"
        iconBgColor="bg-orange-0/50"
        iconColor="text-orange-1"
        cardBorderColor="border-b-orange-1"
        className="shadow-sm"
        contentClassName=""
      >
        <div className="flex flex-col gap-6">
          <div>
            <label className="text-[10px] font-bold text-font-s tracking-wider mb-2 block">
              توضیحات کوتاه
            </label>
            <div className="text-sm text-font-p border-r-2 border-blue-1/30 pr-4 leading-relaxed">
              {property.short_description || "توضیحی وارد نشده است"}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-font-s tracking-wider mb-2 block">
              توضیحات کامل
            </label>
            <div className="text-sm text-font-p bg-bg/50 rounded-xl overflow-hidden leading-loose">
              {property.description ? (
                <div className="p-5">
                  <ReadMore content={property.description} isHTML={true} maxHeight="200px" />
                </div>
              ) : (
                <EmptyState
                  title="توضیحاتی ثبت نشده است"
                  description="هیچ توضیحات تکمیلی برای این ملک در سیستم موجود نیست"
                  icon={FileText}
                  size="sm"
                  fullBleed={true}
                />
              )}
            </div>
          </div>
        </div>
      </CardWithIcon>

      {property.floor_plans && property.floor_plans.length > 0 && (
        <CardWithIcon
          icon={Home}
          title="پلان طبقات"
          iconBgColor="bg-indigo-0/50"
          iconColor="text-indigo-1"
          cardBorderColor="border-b-indigo-1"
          className="shadow-sm"
          contentClassName=""
        >
          <Accordion
            type="single"
            collapsible
            defaultValue={`floor-plan-${property.floor_plans[0].id}`}
            className="w-full flex flex-col gap-4"
            onValueChange={(value) => {
              if (value) {
                const floorPlanId = parseInt(value.replace("floor-plan-", ""));
                if (floorPlanId && property.floor_plans?.some((fp) => fp.id === floorPlanId)) {
                  loadFloorPlanImages(floorPlanId);
                }
              }
            }}
          >
            {property.floor_plans.map((floorPlan) => {
              const images = floorPlanImages[floorPlan.id] || [];
              const isLoading = loadingImages[floorPlan.id];

              return (
                <AccordionItem
                  key={floorPlan.id}
                  value={`floor-plan-${floorPlan.id}`}
                  className="border border-br rounded-xl bg-bg/30 px-5 overflow-hidden transition-all hover:bg-bg/50"
                >
                  <AccordionTrigger className="hover:no-underline py-5">
                    <div className="flex flex-row items-center justify-between w-full ml-4">
                      <span className="text-base font-black text-font-p tracking-tight">
                        {floorPlan.title}
                      </span>
                      <div className="hidden sm:flex items-center gap-6 text-[11px] font-bold text-font-s tracking-wider">
                        <div className="flex items-center gap-1.5 bg-bg px-2.5 py-1 rounded-md border border-br/40">
                          <Maximize2 className="w-4 h-4 text-indigo-1 opacity-70" />
                          <span>
                            {typeof floorPlan.floor_size === "number"
                              ? formatArea(floorPlan.floor_size)
                              : floorPlan.floor_size}
                          </span>
                        </div>
                        {floorPlan.bedrooms !== null && (
                          <div className="flex items-center gap-1.5 bg-bg px-2.5 py-1 rounded-md border border-br/40">
                            <Building2 className="w-4 h-4 text-indigo-1 opacity-70" />
                            <span>{floorPlan.bedrooms} خواب</span>
                          </div>
                        )}
                        {floorPlan.bathrooms !== null && (
                          <div className="flex items-center gap-1.5 bg-bg px-2.5 py-1 rounded-md border border-br/40">
                            <span>{floorPlan.bathrooms} سرویس</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-8">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 pt-6 border-t border-br/40">
                      {/* Right (In RTL, this is the Start/Right side): Stats Grid */}
                      <div className="flex flex-col gap-6 order-2 lg:order-1">
                        <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                          <div className="p-4 rounded-2xl bg-wt/50 border border-br/40 flex flex-col items-center justify-center gap-1.5 text-center group hover:border-indigo-1/30 transition-all shadow-xs hover:shadow-md">
                            <span className="text-[10px] font-bold text-font-s tracking-widest opacity-60">مساحت</span>
                            <div className="flex items-center gap-2">
                              <Maximize2 className="w-4 h-4 text-indigo-1" />
                              <span className="text-base font-black text-font-p">
                                {typeof floorPlan.floor_size === "number"
                                  ? formatArea(floorPlan.floor_size)
                                  : floorPlan.floor_size}
                              </span>
                            </div>
                          </div>

                          {floorPlan.bedrooms !== null && (
                            <div className="p-4 rounded-2xl bg-wt/50 border border-br/40 flex flex-col items-center justify-center gap-1.5 text-center group hover:border-indigo-1/30 transition-all shadow-xs hover:shadow-md">
                              <span className="text-[10px] font-bold text-font-s tracking-widest opacity-60">تعداد خواب</span>
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-indigo-1" />
                                <span className="text-base font-black text-font-p">{floorPlan.bedrooms} اتاق</span>
                              </div>
                            </div>
                          )}

                          {floorPlan.bathrooms !== null && (
                            <div className="p-4 rounded-2xl bg-wt/50 border border-br/40 flex flex-col items-center justify-center gap-1.5 text-center group hover:border-indigo-1/30 transition-all shadow-xs hover:shadow-md">
                              <span className="text-[10px] font-bold text-font-s tracking-widest opacity-60">سرویس بهداشتی</span>
                              <div className="flex items-center gap-2">
                                <span className="text-base font-black text-font-p">{floorPlan.bathrooms} مورد</span>
                              </div>
                            </div>
                          )}

                          {floorPlan.floor_number !== null && (
                            <div className="p-4 rounded-2xl bg-wt/50 border border-br/40 flex flex-col items-center justify-center gap-1.5 text-center group hover:border-indigo-1/30 transition-all shadow-xs hover:shadow-md">
                              <span className="text-[10px] font-bold text-font-s tracking-widest opacity-60">طبقه</span>
                              <span className="text-base font-black text-font-p">{floorPlan.floor_number}</span>
                            </div>
                          )}

                          {floorPlan.unit_type && (
                            <div className="p-4 rounded-2xl bg-wt/50 border border-br/40 flex flex-col items-center justify-center gap-1.5 text-center group hover:border-indigo-1/30 transition-all shadow-xs hover:shadow-md">
                              <span className="text-[10px] font-bold text-font-s tracking-widest opacity-60">نوع واحد</span>
                              <span className="text-base font-black text-font-p">{floorPlan.unit_type}</span>
                            </div>
                          )}

                          {floorPlan.price && (
                            <div className="p-4 rounded-2xl bg-indigo-0/40 border border-indigo-1/20 flex flex-col items-center justify-center gap-1.5 text-center group transition-all col-span-2 sm:col-span-1 xl:col-span-1 shadow-xs hover:shadow-md">
                              <span className="text-[10px] font-bold text-indigo-1 tracking-widest">قیمت</span>
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4 text-indigo-1" />
                                <span className="text-base font-black text-font-p">
                                  {formatPriceToPersian(floorPlan.price, floorPlan.currency || 'تومان')}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {floorPlan.description && (
                          <div className="flex flex-col gap-3 bg-bg/40 p-5 rounded-2xl border border-br/30">
                            <div className="flex items-center gap-2 text-[11px] font-bold text-font-s tracking-widest opacity-70">
                              <FileText className="w-4 h-4" />
                              <span>توضیحات تکمیلی پلان</span>
                            </div>
                            <p className="text-sm text-font-p leading-relaxed italic opacity-90 pr-2 border-r-2 border-indigo-1/20">
                              {floorPlan.description}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Left (In RTL, this is the End/Left side): Image */}
                      <div className="order-1 lg:order-2">
                        {(images.length > 0 ||
                          isLoading ||
                          (floorPlan.main_image &&
                            (floorPlan.main_image.file_url || floorPlan.main_image.url))) && (
                            <div className="rounded-2xl overflow-hidden bg-wt/50 border border-br/60 shadow-md lg:sticky lg:top-4">
                              {isLoading ? (
                                <div className="flex items-center justify-center py-20">
                                  <Loader2 className="w-10 h-10 animate-spin text-indigo-1 opacity-30" />
                                </div>
                              ) : images.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4 p-4">
                                  {images.map((imageItem) => {
                                    const imageUrl = imageItem.image?.file_url || imageItem.image?.url;
                                    const fullImageUrl = imageUrl
                                      ? mediaService.getMediaUrlFromObject({
                                        file_url: imageUrl,
                                      } as any)
                                      : null;
                                    return (
                                      fullImageUrl && (
                                        <div
                                          key={imageItem.id}
                                          className="group relative rounded-xl overflow-hidden bg-bg border border-br/40 shadow-sm"
                                        >
                                          <img
                                            src={fullImageUrl}
                                            alt={floorPlan.title}
                                            className="w-full h-auto object-cover aspect-4/3 transition-transform duration-700 group-hover:scale-110"
                                          />
                                          {imageItem.title && (
                                            <div className="absolute bottom-0 inset-x-0 p-3 bg-linear-to-t from-static-b/80 via-static-b/10 to-transparent text-white text-center">
                                              <p className="text-[10px] font-bold tracking-widest">{imageItem.title}</p>
                                            </div>
                                          )}
                                        </div>
                                      )
                                    );
                                  })}
                                </div>
                              ) : (
                                floorPlan.main_image && (
                                  <img
                                    src={mediaService.getMediaUrlFromObject(
                                      floorPlan.main_image as any
                                    )}
                                    alt={floorPlan.title}
                                    className="w-full h-auto aspect-4/3 object-cover shadow-sm"
                                  />
                                )
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardWithIcon>
      )}
    </div>
  );
}
