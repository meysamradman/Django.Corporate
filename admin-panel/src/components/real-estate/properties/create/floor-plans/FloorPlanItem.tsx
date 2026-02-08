import { Button } from "@/components/elements/Button";
import { Maximize2, Trash2, Bed, Bath, DollarSign } from "lucide-react";
import { mediaService } from "@/components/media/services";

interface FloorPlan {
    id?: number;
    title: string;
    slug: string;
    description: string;
    floor_size: number | null;
    size_unit: "sqm" | "sqft";
    bedrooms: number | null;
    bathrooms: number | null;
    price: number | null;
    currency: string;
    floor_number: number | null;
    unit_type: string;
    display_order: number;
    is_available: boolean;
    images: any[];
}

interface FloorPlanItemProps {
    plan: FloorPlan;
    index: number;
    editMode: boolean;
    onEdit: (plan: FloorPlan) => void;
    onDelete: (id: number) => void;
}

export function FloorPlanItem({ plan, index, editMode, onEdit, onDelete }: FloorPlanItemProps) {
    return (
        <div key={plan.id || `temp-${index}`} className="relative border border-br rounded-2xl p-5 bg-wt hover:border-indigo-1/20 transition-all duration-300">
            <div className="flex flex-col lg:flex-row items-start gap-6">
                {plan.images && plan.images.length > 0 && (
                    <div className="w-full lg:w-48 aspect-4/3 rounded-xl overflow-hidden border border-br bg-muted/5 shrink-0">
                        <img
                            src={mediaService.getMediaUrlFromObject(plan.images[0]?.image || plan.images[0])}
                            alt={plan.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}
                <div className="flex-1 min-w-0 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <h4 className="font-black text-font-p text-xl truncate">{plan.title}</h4>
                            <p className="text-[11px] text-font-s/60 line-clamp-1 mt-1 font-medium">{plan.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEdit(plan)}
                                className="h-9 w-9 p-0 text-indigo-1 border-none hover:bg-indigo-0 rounded-xl shadow-sm transition-all duration-300"
                                disabled={!editMode}
                            >
                                <Maximize2 className="h-4.5 w-4.5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onDelete(plan.id!)}
                                className="h-9 w-9 p-0 text-red-1 border-none hover:bg-red-0 hover:text-red-1 rounded-xl shadow-sm transition-all duration-300"
                                disabled={!editMode}
                            >
                                <Trash2 className="h-4.5 w-4.5" />
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-bg p-3 rounded-2xl border border-br/50 group/detail transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-wt rounded-xl flex items-center justify-center border border-br/30 shadow-sm">
                                    <Maximize2 className="h-4.5 w-4.5 text-font-s" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-font-s/40 uppercase tracking-tighter">مساحت</p>
                                    <p className="font-bold text-font-p text-sm">
                                        {plan.floor_size} {plan.size_unit === "sqm" ? "متر" : "فوت"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {plan.bedrooms !== null && (
                            <div className="bg-bg p-3 rounded-2xl border border-br/50 group/detail transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-wt rounded-xl flex items-center justify-center border border-br/30 shadow-sm">
                                        <Bed className="h-4.5 w-4.5 text-font-s" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-font-s/40 uppercase tracking-tighter">اتاق خواب</p>
                                        <p className="font-bold text-font-p text-sm">{plan.bedrooms} اتاق</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {plan.bathrooms !== null && (
                            <div className="bg-bg p-3 rounded-2xl border border-br/50 group/detail transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-wt rounded-xl flex items-center justify-center border border-br/30 shadow-sm">
                                        <Bath className="h-4.5 w-4.5 text-font-s" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-font-s/40 uppercase tracking-tighter">سرویس</p>
                                        <p className="font-bold text-font-p text-sm">{plan.bathrooms} مورد</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {plan.price !== null && (
                            <div className="bg-bg p-3 rounded-2xl border border-br/50 group/detail transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-wt rounded-xl flex items-center justify-center border border-br/30 shadow-sm">
                                        <DollarSign className="h-4.5 w-4.5 text-font-s" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-font-s/40 uppercase tracking-tighter">قیمت</p>
                                        <p className="font-bold text-font-p text-sm truncate">
                                            {plan.price.toLocaleString()} {plan.currency}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {(plan.floor_number !== null || plan.unit_type) && (
                        <div className="flex flex-wrap gap-2 pt-1">
                            {plan.floor_number !== null && (
                                <span className="inline-flex items-center px-3 py-1.5 bg-muted/10 rounded-full text-xs font-bold text-font-s border border-br">
                                    <span className="opacity-50 ml-1">طبقه:</span> {plan.floor_number}
                                </span>
                            )}
                            {plan.unit_type && (
                                <span className="inline-flex items-center px-3 py-1.5 bg-bg rounded-full text-xs font-bold text-font-s border border-br">
                                    <span className="opacity-50 ml-1">نوع واحد:</span> {plan.unit_type}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
