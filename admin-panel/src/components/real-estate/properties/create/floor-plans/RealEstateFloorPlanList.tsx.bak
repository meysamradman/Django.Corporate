
import { Plus, Home } from "lucide-react";
import { RealEstateFloorPlanItem } from "./RealEstateFloorPlanItem";
import type { EditableFloorPlan } from "@/types/real_estate/floorPlanForm";

interface RealEstateFloorPlanListProps {
    floorPlans: EditableFloorPlan[];
    propertyId?: number;
    isAdding: boolean;
    editMode: boolean;
    onAdd: () => void;
    onEdit: (plan: EditableFloorPlan) => void;
    onDelete: (id: number) => void;
}

export function RealEstateFloorPlanList({
    floorPlans,
    propertyId,
    isAdding,
    editMode,
    onAdd,
    onEdit,
    onDelete
}: RealEstateFloorPlanListProps) {
    return (
        <div className="space-y-6">
            {!propertyId && floorPlans.length === 0 && !isAdding && (
                <div className="flex items-start gap-4 p-5 bg-indigo-0/30 border border-indigo-1/10 rounded-2xl">
                    <div className="shrink-0 w-10 h-10 bg-indigo rounded-xl flex items-center justify-center shadow-lg shadow-indigo/20">
                        <Home className="h-5 w-5 text-static-w" />
                    </div>
                    <div className="flex-1 space-y-1">
                        <p className="text-sm font-bold text-font-p">
                            افزودن پلان‌های ملک
                        </p>
                        <p className="text-[11px] text-font-s/70 leading-relaxed">
                            در این بخش می‌توانید نقشه‌ها، رندرهای سه بعدی و مشخصات هر واحد یا طبقه را به صورت مجزا ثبت کنید.
                        </p>
                    </div>
                </div>
            )}

            {!isAdding && (
                <div onClick={onAdd} className="group cursor-pointer relative overflow-hidden h-24 border-2 border-dashed border-br rounded-2xl flex items-center justify-center bg-wt hover:bg-indigo-0/5 hover:border-indigo-1/30 transition-all duration-500">
                    <div className="absolute inset-0 bg-linear-to-r from-indigo-0/0 via-indigo-0/5 to-indigo-0/0 opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-1000" />
                    <div className="flex flex-col items-center gap-1 relative z-10">
                        <div className="w-10 h-10 rounded-full bg-indigo-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Plus className="w-6 h-6 text-indigo-1" />
                        </div>
                        <span className="text-[11px] font-black text-font-p tracking-tight">افزودن پلان جدید</span>
                    </div>
                </div>
            )}

            {floorPlans.length > 0 && !isAdding && (
                <div className="space-y-4 mt-6">
                    <div className="flex items-center gap-3 mb-2 px-1">
                        <div className="w-2 h-2 rounded-full bg-indigo shadow-glow" />
                        <h5 className="text-[11px] font-black uppercase tracking-widest text-font-s opacity-60">پلان‌های ثبت شده</h5>
                    </div>
                    {floorPlans.map((plan, index) => (
                        <RealEstateFloorPlanItem
                            key={plan.id || `temp-${index}`}
                            plan={plan}
                            index={index}
                            editMode={editMode}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
