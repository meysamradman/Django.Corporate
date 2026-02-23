
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { Trash2 } from "lucide-react";

interface RealEstateStandardAttributesProps {
    fieldOptions: any;
    currentAttributes: any;
    handleAttributeChange: (key: string, value: any) => void;
    editMode: boolean;
    predefinedFields: Array<{ key: string, label: string, icon: any }>;
}

export function RealEstateStandardAttributes({
    fieldOptions,
    currentAttributes,
    handleAttributeChange,
    editMode,
    predefinedFields
}: RealEstateStandardAttributesProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predefinedFields.map((field) => (
                <div
                    key={field.key}
                    className="group flex flex-col p-3 border border-br rounded-xl bg-wt hover:border-indigo-1/30 transition-all duration-200"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-0 flex items-center justify-center group-hover:bg-indigo-1/10 transition-colors">
                            <field.icon className="w-4 h-4 text-indigo-1" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <label className="text-[10px] font-bold text-font-s/60 uppercase">
                                {field.label}
                            </label>
                            <span className="font-semibold text-font-p truncate">
                                {fieldOptions?.[field.key]?.find((opt: any) => opt[0] === currentAttributes[field.key])?.[1] || "تنظیم نشده"}
                            </span>
                        </div>
                    </div>

                    <Select
                        value={currentAttributes[field.key] || ''}
                        onValueChange={(val) => handleAttributeChange(field.key, val)}
                        disabled={!editMode}
                    >
                        <SelectTrigger className="w-full bg-muted/5 border-br hover:bg-muted/10 transition-all rounded-lg h-9 text-font-s px-3">
                            <SelectValue placeholder="انتخاب کنید..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__none__" className="text-red-1 font-bold">
                                <div className="flex items-center gap-2">
                                    <Trash2 className="w-3 h-3" />
                                    <span>پاک کردن انتخاب</span>
                                </div>
                            </SelectItem>
                            {fieldOptions?.[field.key]?.map((opt: any) => (
                                <SelectItem key={opt[0]} value={opt[0]}>{opt[1]}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            ))}
        </div>
    );
}
