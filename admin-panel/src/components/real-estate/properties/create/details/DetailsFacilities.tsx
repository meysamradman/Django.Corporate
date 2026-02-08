import { Label } from "@/components/elements/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { msg } from "@/core/messages";
import { Key, Box, Car, Utensils, Sofa } from "lucide-react";

interface DetailsFacilitiesProps {
    formData: any;
    editMode: boolean;
    errors?: Record<string, string>;
    fieldOptions: any;
    isLoadingOptions: boolean;
    handleSelectChange: (field: string) => (value: string) => void;
}

export function DetailsFacilities({
    formData,
    editMode,
    errors,
    fieldOptions,
    isLoadingOptions,
    handleSelectChange
}: DetailsFacilitiesProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                    <Key className="w-4 h-4 text-purple-2" />
                    <Label htmlFor="bedrooms" className="font-bold">تعداد خواب</Label>
                </div>
                <Select
                    value={formData?.bedrooms?.toString() || undefined}
                    onValueChange={handleSelectChange("bedrooms")}
                    disabled={!editMode || isLoadingOptions}
                >
                    <SelectTrigger className="w-full border-br bg-wt">
                        <SelectValue placeholder="انتخاب تعداد خواب" />
                    </SelectTrigger>
                    <SelectContent>
                        {fieldOptions?.bedrooms?.map((item: [number, string]) => (
                            <SelectItem key={item[0]} value={item[0].toString()}>
                                {(msg.realEstate().facilities.bedrooms as any)[item[0]] || item[1]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors?.bedrooms && <p className="text-xs text-red-1">{errors.bedrooms}</p>}
            </div>

            <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                    <Box className="w-4 h-4 text-purple-2" />
                    <Label htmlFor="bathrooms" className="font-bold">تعداد سرویس</Label>
                </div>
                <Select
                    value={formData?.bathrooms?.toString() || undefined}
                    onValueChange={handleSelectChange("bathrooms")}
                    disabled={!editMode || isLoadingOptions}
                >
                    <SelectTrigger className="w-full border-br bg-wt">
                        <SelectValue placeholder="انتخاب تعداد سرویس" />
                    </SelectTrigger>
                    <SelectContent>
                        {fieldOptions?.bathrooms?.map((item: [number, string]) => (
                            <SelectItem key={item[0]} value={item[0].toString()}>
                                {(msg.realEstate().facilities.bathrooms as any)[item[0]] || item[1]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors?.bathrooms && <p className="text-xs text-red-1">{errors.bathrooms}</p>}
            </div>

            <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                    <Car className="w-4 h-4 text-purple-2" />
                    <Label htmlFor="parking_spaces" className="font-bold">پارکینگ</Label>
                </div>
                <Select
                    value={formData?.parking_spaces?.toString() || undefined}
                    onValueChange={handleSelectChange("parking_spaces")}
                    disabled={!editMode || isLoadingOptions}
                >
                    <SelectTrigger className="w-full border-br bg-wt">
                        <SelectValue placeholder="تعداد پارکینگ" />
                    </SelectTrigger>
                    <SelectContent>
                        {fieldOptions?.parking_spaces?.map((item: [number, string]) => (
                            <SelectItem key={item[0]} value={item[0].toString()}>
                                {(msg.realEstate().facilities.parking_spaces as any)[item[0]] || item[1]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors?.parking_spaces && <p className="text-xs text-red-1">{errors.parking_spaces}</p>}
            </div>

            <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                    <Box className="w-4 h-4 text-purple-2" />
                    <Label htmlFor="storage_rooms" className="font-bold">انباری</Label>
                </div>
                <Select
                    value={formData?.storage_rooms?.toString() || undefined}
                    onValueChange={handleSelectChange("storage_rooms")}
                    disabled={!editMode || isLoadingOptions}
                >
                    <SelectTrigger className="w-full border-br bg-wt">
                        <SelectValue placeholder="تعداد انباری" />
                    </SelectTrigger>
                    <SelectContent>
                        {fieldOptions?.storage_rooms?.map((item: [number, string]) => (
                            <SelectItem key={item[0]} value={item[0].toString()}>
                                {(msg.realEstate().facilities.storage_rooms as any)[item[0]] || item[1]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors?.storage_rooms && <p className="text-xs text-red-1">{errors.storage_rooms}</p>}
            </div>

            <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                    <Utensils className="w-4 h-4 text-purple-2" />
                    <Label htmlFor="kitchens" className="font-bold">آشپزخانه</Label>
                </div>
                <Select
                    value={formData?.kitchens?.toString() || undefined}
                    onValueChange={handleSelectChange("kitchens")}
                    disabled={!editMode || isLoadingOptions}
                >
                    <SelectTrigger className="w-full border-br bg-wt">
                        <SelectValue placeholder="تعداد آشپزخانه" />
                    </SelectTrigger>
                    <SelectContent>
                        {fieldOptions?.kitchens?.map((item: [number, string]) => (
                            <SelectItem key={item[0]} value={item[0].toString()}>
                                {(msg.realEstate().facilities.kitchens as any)[item[0]] || item[1]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                    <Sofa className="w-4 h-4 text-purple-2" />
                    <Label htmlFor="living_rooms" className="font-bold">پذیرایی</Label>
                </div>
                <Select
                    value={formData?.living_rooms?.toString() || undefined}
                    onValueChange={handleSelectChange("living_rooms")}
                    disabled={!editMode || isLoadingOptions}
                >
                    <SelectTrigger className="w-full border-br bg-wt">
                        <SelectValue placeholder="تعداد پذیرایی" />
                    </SelectTrigger>
                    <SelectContent>
                        {fieldOptions?.living_rooms?.map((item: [number, string]) => (
                            <SelectItem key={item[0]} value={item[0].toString()}>
                                {(msg.realEstate().facilities.living_rooms as any)[item[0]] || item[1]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
