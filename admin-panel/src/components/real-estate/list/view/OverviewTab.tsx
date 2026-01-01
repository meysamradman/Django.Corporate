import { TabsContent } from "@/components/elements/Tabs";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import type { Property } from "@/types/real_estate/realEstate";
import { Badge } from "@/components/elements/Badge";
import { ReadMore } from "@/components/elements/ReadMore";
import {
  Tag,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Building2,
  MapPin,
  Check,
  Home,
  Info,
} from "lucide-react";
import { Button } from "@/components/elements/Button";

interface OverviewTabProps {
  property: Property;
}

export function OverviewTab({ property }: OverviewTabProps) {
  const imagesCount = property.media_count ? Math.floor(property.media_count * 0.6) : 0;
  const videosCount = property.media_count ? Math.floor(property.media_count * 0.2) : 0;
  const audiosCount = property.media_count ? Math.floor(property.media_count * 0.1) : 0;
  const documentsCount = property.media_count ? Math.floor(property.media_count * 0.1) : 0;

  const labelsCount = property.labels?.length || 0;
  const tagsCount = property.tags?.length || 0;
  const featuresCount = property.features?.length || 0;

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return "-";
    return new Intl.NumberFormat('fa-IR').format(price);
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
          icon={Building2}
          title="ویژگی‌ها"
          iconBgColor="bg-teal"
          iconColor="stroke-teal-2"
          borderColor="border-b-teal-1"
          headerClassName="pb-3"
          titleExtra={<Badge variant="teal">{featuresCount} مورد</Badge>}
        >
            <p className="text-font-s mb-4">
              ویژگی‌های این ملک
            </p>
            {property.features && property.features.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {property.features.map((feature) => (
                  <Badge
                    key={feature.id}
                    variant="teal"
                    className="cursor-default"
                  >
                    {feature.title}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-font-s">
                ویژگی‌ای انتخاب نشده است
              </p>
            )}
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
            {property.extra_attributes?.garage_size && (
              <div className="flex justify-between items-start border-b pb-3">
                <span className="text-font-s text-gray-2 font-medium">اندازه پارکینگ:</span>
                <span className="text-font-p text-right">{property.extra_attributes.garage_size}</span>
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
            {property.extra_attributes?.garages && (
              <div className="flex justify-between items-start border-b pb-3">
                <span className="text-font-s text-gray-2 font-medium">گاراژ:</span>
                <span className="text-font-p text-right">{property.extra_attributes.garages}</span>
              </div>
            )}
            {property.extra_attributes?.available_from && (
              <div className="flex justify-between items-start border-b pb-3">
                <span className="text-font-s text-gray-2 font-medium">قابل استفاده از:</span>
                <span className="text-font-p text-right">{property.extra_attributes.available_from}</span>
              </div>
            )}
            {property.extra_attributes?.roofing && (
              <div className="flex justify-between items-start border-b pb-3">
                <span className="text-font-s text-gray-2 font-medium">سقف:</span>
                <span className="text-font-p text-right">{property.extra_attributes.roofing}</span>
              </div>
            )}
            {property.extra_attributes?.basement && (
              <div className="flex justify-between items-start border-b pb-3">
                <span className="text-font-s text-gray-2 font-medium">زیرزمین:</span>
                <span className="text-font-p text-right">{property.extra_attributes.basement}</span>
              </div>
            )}
            {property.extra_attributes?.structure_type && (
              <div className="flex justify-between items-start border-b pb-3">
                <span className="text-font-s text-gray-2 font-medium">نوع سازه:</span>
                <span className="text-font-p text-right">{property.extra_attributes.structure_type}</span>
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
            {property.extra_attributes?.property_id && (
              <div className="flex justify-between items-start border-b pb-3">
                <span className="text-font-s text-gray-2 font-medium">شناسه ملک:</span>
                <span className="text-font-p text-right">{property.extra_attributes.property_id}</span>
              </div>
            )}
            {property.extra_attributes?.custom_id && (
              <div className="flex justify-between items-start border-b pb-3">
                <span className="text-font-s text-gray-2 font-medium">شناسه سفارشی:</span>
                <span className="text-font-p text-right">{property.extra_attributes.custom_id}</span>
              </div>
            )}
            {property.extra_attributes?.rooms && (
              <div className="flex justify-between items-start border-b pb-3">
                <span className="text-font-s text-gray-2 font-medium">اتاق:</span>
                <span className="text-font-p text-right">{property.extra_attributes.rooms}</span>
              </div>
            )}
            {property.extra_attributes?.floors_no && (
              <div className="flex justify-between items-start border-b pb-3">
                <span className="text-font-s text-gray-2 font-medium">تعداد طبقات:</span>
                <span className="text-font-p text-right">{property.extra_attributes.floors_no}</span>
              </div>
            )}
            {property.extra_attributes?.extra_details && (
              <div className="flex justify-between items-start border-b pb-3">
                <span className="text-font-s text-gray-2 font-medium">جزئیات اضافی:</span>
                <span className="text-font-p text-right">{property.extra_attributes.extra_details}</span>
              </div>
            )}
          </div>
        </div>
      </CardWithIcon>

      {/* Additional Details Section */}
      {(property.extra_attributes?.deposit || property.extra_attributes?.last_remodel_year || property.extra_attributes?.additional_rooms || 
        property.extra_attributes?.pool_size || property.extra_attributes?.amenities || property.extra_attributes?.equipment) && (
        <CardWithIcon
          icon={Info}
          title="جزئیات اضافی"
          iconBgColor="bg-teal"
          iconColor="stroke-teal-2"
          borderColor="border-b-teal-1"
          contentClassName="space-y-0"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1 */}
            <div className="space-y-4">
              {property.extra_attributes?.deposit && (
                <div className="flex justify-between items-start border-b pb-3">
                  <span className="text-font-s text-gray-2 font-medium">ودیعه:</span>
                  <span className="text-font-p text-right">{property.extra_attributes.deposit}</span>
                </div>
              )}
              {property.extra_attributes?.last_remodel_year && (
                <div className="flex justify-between items-start border-b pb-3">
                  <span className="text-font-s text-gray-2 font-medium">سال آخرین بازسازی:</span>
                  <span className="text-font-p text-right">{property.extra_attributes.last_remodel_year}</span>
                </div>
              )}
              {property.extra_attributes?.additional_rooms && (
                <div className="flex justify-between items-start border-b pb-3">
                  <span className="text-font-s text-gray-2 font-medium">اتاق‌های اضافی:</span>
                  <span className="text-font-p text-right">{property.extra_attributes.additional_rooms}</span>
                </div>
              )}
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              {property.extra_attributes?.pool_size && (
                <div className="flex justify-between items-start border-b pb-3">
                  <span className="text-font-s text-gray-2 font-medium">اندازه استخر:</span>
                  <span className="text-font-p text-right">{property.extra_attributes.pool_size}</span>
                </div>
              )}
              {property.extra_attributes?.amenities && (
                <div className="flex justify-between items-start border-b pb-3">
                  <span className="text-font-s text-gray-2 font-medium">امکانات:</span>
                  <span className="text-font-p text-right">{property.extra_attributes.amenities}</span>
                </div>
              )}
              {property.extra_attributes?.equipment && (
                <div className="flex justify-between items-start border-b pb-3">
                  <span className="text-font-s text-gray-2 font-medium">تجهیزات:</span>
                  <span className="text-font-p text-right">{property.extra_attributes.equipment}</span>
                </div>
              )}
            </div>
          </div>
        </CardWithIcon>
      )}

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

      {/* Features Section with Checkboxes in 3 Columns */}
      {property.features && property.features.length > 0 && (
        <CardWithIcon
          icon={Building2}
          title="ویژگی‌ها"
          iconBgColor="bg-teal"
          iconColor="stroke-teal-2"
          borderColor="border-b-teal-1"
          contentClassName="space-y-0"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {property.features.map((feature) => (
              <div key={feature.id} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-gray-1 flex items-center justify-center bg-white">
                  <Check className="w-3 h-3 text-green-2 stroke-[3]" />
                </div>
                <span className="text-font-p">{feature.title}</span>
              </div>
            ))}
          </div>
        </CardWithIcon>
      )}

      {/* Floor Plans Section */}
      {property.floor_plans && property.floor_plans.length > 0 && (
        <CardWithIcon
          icon={Home}
          title="پلان طبقات"
          iconBgColor="bg-orange"
          iconColor="stroke-orange-2"
          borderColor="border-b-orange-1"
          contentClassName="space-y-6"
        >
          <div className="space-y-6">
            {property.floor_plans.map((floorPlan) => (
              <div key={floorPlan.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Home className="w-5 h-5 text-gray-2" />
                  <h4 className="text-font-p font-semibold">{floorPlan.title}</h4>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-font-s text-gray-2">
                  <span>اندازه: {floorPlan.floor_size} {floorPlan.size_unit === 'sqft' ? 'فوت مربع' : 'متر مربع'}</span>
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
                      قیمت: {formatPrice(floorPlan.price)} {floorPlan.currency || 'تومان'}
                    </span>
                  )}
                </div>
                {floorPlan.description && (
                  <p className="text-font-s text-gray-2 mt-2">{floorPlan.description}</p>
                )}
              </div>
            ))}
          </div>
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

