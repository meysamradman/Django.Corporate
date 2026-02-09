
import { useState } from "react";
import type { Property } from "@/types/real_estate/realEstate";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/elements/Accordion";
import { realEstateApi } from "@/api/real-estate";
import { mediaService } from "@/components/media/services";
import { formatArea, formatPriceToPersian } from "@/core/utils/realEstateFormat";
import {
    Home,
    Loader2,
    Maximize2,
    DollarSign,
    Building2,
    FileText
} from "lucide-react";

interface RealEstateFloorPlansProps {
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

export function RealEstateFloorPlans({ property }: RealEstateFloorPlansProps) {
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

    if (!property.floor_plans || property.floor_plans.length === 0) {
        return null;
    }

    return (
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
    );
}
