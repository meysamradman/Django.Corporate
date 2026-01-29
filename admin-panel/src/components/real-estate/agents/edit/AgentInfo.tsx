import { useState, useEffect, useCallback } from "react";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { TabsContent } from "@/components/elements/Tabs";
import { FormFieldInput, FormFieldTextarea } from "@/components/shared/FormField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { Label } from "@/components/elements/Label";
import { Switch } from "@/components/elements/Switch";
import { FileText, Settings } from "lucide-react";
import { realEstateApi } from "@/api/real-estate";
import type { PropertyAgent } from "@/types/real_estate/agent/realEstateAgent";

interface BaseInfoTabProps {
    formData: Partial<PropertyAgent>;
    handleInputChange: (field: keyof PropertyAgent, value: any) => void;
    editMode: boolean;
}

export default function AgentInfo({ formData, handleInputChange, editMode }: BaseInfoTabProps) {
    const [provinces, setProvinces] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [loadingLocation, setLoadingLocation] = useState<boolean>(false);
    const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(formData.province ?? null);

    useEffect(() => {
        const loadProvinces = async () => {
            try {
                setLoadingLocation(true);
                const data = await realEstateApi.getProvinces();
                setProvinces(data || []);
            } catch (e) {
                setProvinces([]);
            } finally {
                setLoadingLocation(false);
            }
        };
        loadProvinces();
    }, []);

    useEffect(() => {
        setSelectedProvinceId(formData.province ?? null);
    }, [formData.province]);

    useEffect(() => {
        if (!selectedProvinceId) {
            setCities([]);
            return;
        }

        const loadCities = async () => {
            try {
                setLoadingLocation(true);
                const data = await realEstateApi.getProvinceCities(selectedProvinceId);
                setCities(data || []);
            } catch (e) {
                setCities([]);
            } finally {
                setLoadingLocation(false);
            }
        };
        loadCities();
    }, [selectedProvinceId]);

    const handleProvinceChange = useCallback((value: string) => {
        const provinceId = value ? Number(value) : null;
        setSelectedProvinceId(provinceId);
        handleInputChange("province" as keyof PropertyAgent, provinceId);
        handleInputChange("city" as keyof PropertyAgent, null);
    }, [handleInputChange]);

    const handleCityChange = useCallback((value: string) => {
        const cityId = value ? Number(value) : null;
        handleInputChange("city" as keyof PropertyAgent, cityId);
    }, [handleInputChange]);

    return (
        <TabsContent value="account" className="mt-0 space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 min-w-0">
                    <CardWithIcon
                        icon={FileText}
                        title="اطلاعات پایه"
                        iconBgColor="bg-blue"
                        iconColor="stroke-blue-2"
                        borderColor="border-b-blue-1"
                    >
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <FormFieldInput
                                    label="نام"
                                    value={formData.first_name || ""}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("first_name", e.target.value)}
                                    required
                                    disabled={!editMode}
                                />
                                <FormFieldInput
                                    label="نام خانوادگی"
                                    value={formData.last_name || ""}
                                    onChange={(e) => handleInputChange("last_name", e.target.value)}
                                    required
                                    disabled={!editMode}
                                />
                                <FormFieldInput
                                    label="تلفن"
                                    value={formData.phone || ""}
                                    onChange={(e) => handleInputChange("phone", e.target.value)}
                                    type="tel"
                                    disabled={!editMode}
                                />
                                <FormFieldInput
                                    label="ایمیل"
                                    value={formData.email || ""}
                                    onChange={(e) => handleInputChange("email", e.target.value)}
                                    type="email"
                                    disabled={!editMode}
                                />
                                <FormFieldInput
                                    label="شماره پروانه"
                                    value={formData.license_number || ""}
                                    onChange={(e) => handleInputChange("license_number", e.target.value)}
                                    disabled={!editMode}
                                />
                                <FormFieldInput
                                    label="تخصص"
                                    value={formData.specialization || ""}
                                    onChange={(e) => handleInputChange("specialization", e.target.value)}
                                    disabled={!editMode}
                                />
                                <FormFieldInput
                                    label="سال‌های تجربه"
                                    value={formData.experience_years?.toString() || ""}
                                    onChange={(e) => handleInputChange("experience_years", e.target.value ? Number(e.target.value) : null)}
                                    type="number"
                                    disabled={!editMode}
                                />
                                <div className="space-y-2">
                                    <Label>استان</Label>
                                    <Select
                                        disabled={!editMode || loadingLocation}
                                        value={formData?.province ? String(formData.province) : "none"}
                                        onValueChange={handleProvinceChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={loadingLocation ? "در حال بارگذاری..." : "استان را انتخاب کنید"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">انتخاب کنید</SelectItem>
                                            {(provinces || []).map((p) => (
                                                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>شهر</Label>
                                    <Select
                                        disabled={!editMode || loadingLocation}
                                        value={formData?.city ? String(formData.city) : "none"}
                                        onValueChange={handleCityChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={loadingLocation ? "در حال بارگذاری..." : "شهر را انتخاب کنید"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">انتخاب کنید</SelectItem>
                                            {(cities || []).map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <FormFieldTextarea
                                label="بیوگرافی"
                                value={formData.bio || ""}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("bio", e.target.value)}
                                rows={4}
                                disabled={!editMode}
                            />

                            <FormFieldInput
                                label="آدرس"
                                value={formData.address || ""}
                                onChange={(e) => handleInputChange("address", e.target.value)}
                                disabled={!editMode}
                            />
                        </div>
                    </CardWithIcon>
                </div>

                <div className="w-full lg:w-[420px] lg:shrink-0">
                    <CardWithIcon
                        icon={Settings}
                        title="تنظیمات"
                        iconBgColor="bg-blue"
                        iconColor="stroke-blue-2"
                        borderColor="border-b-blue-1"
                        className="lg:sticky lg:top-20"
                    >
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <label className="text-font-p font-medium">وضعیت فعال</label>
                                        <p className="text-font-s text-muted-foreground">مشاور در لیست نمایش داده می‌شود</p>
                                    </div>
                                    <Switch
                                        checked={formData.is_active ?? true}
                                        onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                                        disabled={!editMode}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <label className="text-font-p font-medium">وضعیت تأیید</label>
                                        <p className="text-font-s text-muted-foreground">مشاور تأیید شده است</p>
                                    </div>
                                    <Switch
                                        checked={formData.is_verified ?? false}
                                        onCheckedChange={(checked) => handleInputChange("is_verified", checked)}
                                        disabled={!editMode}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardWithIcon>
                </div>
            </div>
        </TabsContent>
    );
}

