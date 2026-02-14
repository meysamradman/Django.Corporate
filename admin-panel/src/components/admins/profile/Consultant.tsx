import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Input } from "@/components/elements/Input";
import { Button } from "@/components/elements/Button";
import { Textarea } from "@/components/elements/Textarea";
import { TabsContent } from "@/components/elements/Tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { FormField } from "@/components/shared/FormField";
import {
    Globe,
    CheckCircle2,
    BadgeCheck,
    UploadCloud,
    X,
    TrendingUp,
    Star,
    MessageSquare,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate";
import { Loader } from "@/components/elements/Loader";
import { PersianDatePicker } from "@/components/elements/PersianDatePicker";
import { Switch } from "@/components/elements/Switch";
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import { mediaService } from "@/components/media/services";
import type { Media } from "@/types/shared/media";
import type { AdminWithProfile } from "@/types/auth/admin";
import { Label } from "@/components/elements/Label";

interface ConsultantTabProps {
    admin: AdminWithProfile;
    formData: any;
    handleInputChange: (field: string, value: any) => void;
    handleSaveProfile: () => void;
    isSaving?: boolean;
    fieldErrors?: Record<string, string>;
}

export function Consultant({
    admin,
    formData,
    handleInputChange,
    handleSaveProfile,
    isSaving = false,
    fieldErrors = {},
}: ConsultantTabProps) {
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const isConsultantEditable = true;

    const { data: agenciesResponse, isLoading: agenciesLoading } = useQuery({
        queryKey: ['agencies-all'],
        queryFn: () => realEstateApi.getAgencies({ page: 1, size: 1000 }),
        staleTime: 5 * 60 * 1000,
    });

    const agencies = agenciesResponse?.data || [];

    const agentProfile = admin.agent_profile;

    if (!agentProfile && admin.user_role_type !== 'consultant') {
        return null;
    }

    const ogImage = formData.og_image || agentProfile?.og_image;
    const ogImageUrl = ogImage ? mediaService.getMediaUrlFromObject(ogImage) : "";
    const totalSales = Number(agentProfile?.total_sales ?? 0);
    const rating = Number(agentProfile?.rating ?? 0);
    const totalReviews = Number(agentProfile?.total_reviews ?? 0);
    const totalSalesValue = Number(agentProfile?.total_sales_value ?? 0);
    const totalCommissions = Number(agentProfile?.total_commissions ?? 0);
    const propertiesSold = Number(agentProfile?.properties_sold ?? 0);
    const propertiesRented = Number(agentProfile?.properties_rented ?? 0);
    const conversionRate = Number(agentProfile?.conversion_rate ?? 0);
    const avgDealTime = Number(agentProfile?.avg_deal_time ?? 0);
    const leadToContractRate = Number(agentProfile?.lead_to_contract_rate ?? 0);
    const failureRate = Number(agentProfile?.failure_rate ?? 0);

    const handleOgImageSelect = (media: Media | Media[] | null) => {
        const selected = Array.isArray(media) ? media[0] || null : media;
        handleInputChange("og_image", selected);
        handleInputChange("og_image_id", selected?.id || null);
        setIsMediaModalOpen(false);
    };

    const handleRemoveOgImage = () => {
        handleInputChange("og_image", null);
        handleInputChange("og_image_id", null);
    };

    return (
        <TabsContent value="consultant">
            <div className="space-y-8">
                <CardWithIcon
                    icon={TrendingUp}
                    title="آمار مشاور"
                    iconBgColor="bg-teal-1"
                    iconColor="text-white"
                    cardBorderColor="border-b-teal-1"
                    className="bg-teal-0/10 shadow-sm border-teal-1/20"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="rounded-xl border border-br p-4 bg-card">
                            <p className="text-font-s mb-2">تعداد فروش</p>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-teal-1" />
                                <p className="text-2xl font-black text-font-p">{totalSales.toLocaleString('fa-IR')}</p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-br p-4 bg-card">
                            <p className="text-font-s mb-2">امتیاز</p>
                            <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-amber-1" />
                                <p className="text-2xl font-black text-font-p">{rating.toFixed(1)}</p>
                                <span className="text-font-s text-font-m">از ۵</span>
                            </div>
                        </div>

                        <div className="rounded-xl border border-br p-4 bg-card">
                            <p className="text-font-s mb-2">تعداد نظرات</p>
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-blue-1" />
                                <p className="text-2xl font-black text-font-p">{totalReviews.toLocaleString('fa-IR')}</p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-br p-4 bg-card">
                            <p className="text-font-s mb-2">ارزش کل معاملات</p>
                            <p className="text-xl font-black text-font-p">{totalSalesValue.toLocaleString('fa-IR')}</p>
                        </div>

                        <div className="rounded-xl border border-br p-4 bg-card">
                            <p className="text-font-s mb-2">کمیسیون کل</p>
                            <p className="text-xl font-black text-font-p">{totalCommissions.toLocaleString('fa-IR')}</p>
                        </div>

                        <div className="rounded-xl border border-br p-4 bg-card">
                            <p className="text-font-s mb-2">تعداد فروش/اجاره</p>
                            <p className="text-xl font-black text-font-p">{propertiesSold.toLocaleString('fa-IR')} / {propertiesRented.toLocaleString('fa-IR')}</p>
                        </div>

                        <div className="rounded-xl border border-br p-4 bg-card">
                            <p className="text-font-s mb-2">نرخ تبدیل</p>
                            <p className="text-xl font-black text-font-p">{conversionRate.toLocaleString('fa-IR')}٪</p>
                        </div>

                        <div className="rounded-xl border border-br p-4 bg-card">
                            <p className="text-font-s mb-2">میانگین زمان معامله</p>
                            <p className="text-xl font-black text-font-p">{avgDealTime.toLocaleString('fa-IR')} روز</p>
                        </div>

                        <div className="rounded-xl border border-br p-4 bg-card">
                            <p className="text-font-s mb-2">نرخ لید به قرارداد</p>
                            <p className="text-xl font-black text-font-p">{leadToContractRate.toLocaleString('fa-IR')}٪</p>
                        </div>

                        <div className="rounded-xl border border-br p-4 bg-card">
                            <p className="text-font-s mb-2">نرخ شکست</p>
                            <p className="text-xl font-black text-font-p">{failureRate.toLocaleString('fa-IR')}٪</p>
                        </div>
                    </div>
                </CardWithIcon>

                <CardWithIcon
                    icon={BadgeCheck}
                    title="اطلاعات حرفه‌ای مشاور"
                    iconBgColor="bg-blue-1"
                    iconColor="text-white"
                    cardBorderColor="border-b-blue-1"
                    className="bg-blue-0/10 shadow-sm border-blue-1/20"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            label="شماره پروانه کسب"
                            htmlFor="license_number"
                            error={fieldErrors.license_number}
                            required
                        >
                            <Input
                                id="license_number"
                                value={formData.license_number || ""}
                                onChange={(e) => handleInputChange("license_number", e.target.value)}
                                disabled={!isConsultantEditable}
                                placeholder="مثال: ۱۲۳۴۵"
                            />
                        </FormField>

                        <FormField
                            label="تاریخ انقضای پروانه"
                            htmlFor="license_expire_date"
                            error={fieldErrors.license_expire_date}
                        >
                            <PersianDatePicker
                                value={formData.license_expire_date || ""}
                                onChange={(date) => handleInputChange("license_expire_date", date)}
                                disabled={!isConsultantEditable}
                                placeholder="تاریخ انقضا را انتخاب کنید"
                            />
                        </FormField>

                        <FormField
                            label="آژانس املاک همکار"
                            htmlFor="agency_id"
                            error={fieldErrors.agency_id}
                        >
                            {agenciesLoading ? (
                                <div className="flex items-center justify-center h-9 border border-br rounded-md bg-card">
                                    <Loader className="size-5" />
                                </div>
                            ) : (
                                <Select
                                    value={formData.agency_id?.toString() || "none"}
                                    onValueChange={(value) => {
                                        handleInputChange("agency_id", value === "none" ? null : parseInt(value));
                                    }}
                                    disabled={!isConsultantEditable}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="انتخاب آژانس (اختیاری)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">بدون آژانس (فعالیت مستقل)</SelectItem>
                                        {agencies.map((agency) => (
                                            <SelectItem key={agency.id} value={agency.id.toString()}>
                                                {agency.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </FormField>

                        <FormField
                            label="تخصص اصلی (دسته بندی)"
                            htmlFor="specialization"
                            error={fieldErrors.specialization}
                        >
                            <Input
                                id="specialization"
                                value={formData.specialization || ""}
                                onChange={(e) => handleInputChange("specialization", e.target.value)}
                                disabled={!isConsultantEditable}
                                placeholder="مثال: مسکونی، اداری، مشارکت در ساخت"
                            />
                        </FormField>

                        <div className="md:col-span-2">
                            <FormField
                                label="بیوگرافی و سوابق فعالیت"
                                htmlFor="agent_bio"
                                error={fieldErrors.agent_bio}
                            >
                                <Textarea
                                    id="agent_bio"
                                    value={formData.agent_bio || ""}
                                    onChange={(e) => handleInputChange("agent_bio", e.target.value)}
                                    disabled={!isConsultantEditable}
                                    placeholder="توضیحات کوتاهی درباره تجربه و سوابق کاری مشاور..."
                                    rows={4}
                                />
                            </FormField>
                        </div>

                        <div className="md:col-span-2 mt-2">
                            <div className="flex items-center justify-between p-5 border-2 border-dashed border-blue-1/30 rounded-2xl bg-white/50 backdrop-blur-sm shadow-inner transition-all hover:bg-white hover:border-blue-1/50 group">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-blue-1/10 text-blue-1 group-hover:bg-blue-1 group-hover:text-white transition-colors">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <Label className="text-base font-bold text-font-p block">احراز هویت و تایید در سیستم</Label>
                                        <p className="text-xs text-font-s mt-1">با تایید این بخش، نشان "مشاور تایید شده" در پروفایل نمایش داده می‌شود</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={formData.is_verified || false}
                                    onCheckedChange={(checked) => handleInputChange("is_verified", checked)}
                                        disabled={!isConsultantEditable}
                                />
                            </div>
                        </div>
                    </div>
                </CardWithIcon>

                <CardWithIcon
                    icon={Globe}
                    title="تنظیمات سئو و نمایش پروفایل"
                    iconBgColor="bg-amber-1"
                    iconColor="text-white"
                    cardBorderColor="border-b-amber-1"
                    className="bg-amber-0/10 shadow-sm border-amber-1/20"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 lg:col-span-1 space-y-6">
                            <FormField
                                label="عنوان سئو (Meta Title)"
                                htmlFor="meta_title"
                                error={fieldErrors.meta_title}
                            >
                                <Input
                                    id="meta_title"
                                    value={formData.meta_title || ""}
                                    onChange={(e) => handleInputChange("meta_title", e.target.value)}
                                    disabled={!isConsultantEditable}
                                    placeholder="عنوان صفحه در گوگل (مثلاً: مشاور املاک - نام مشاور)"
                                    maxLength={70}
                                />
                            </FormField>

                            <FormField
                                label="کلمات کلیدی (Keywords)"
                                htmlFor="meta_keywords"
                                error={fieldErrors.meta_keywords}
                            >
                                <Input
                                    id="meta_keywords"
                                    value={formData.meta_keywords || ""}
                                    onChange={(e) => handleInputChange("meta_keywords", e.target.value)}
                                    disabled={!isConsultantEditable}
                                    placeholder="کلمات کلیدی با کاما (,) جدا شوند"
                                    maxLength={200}
                                />
                            </FormField>

                            <FormField
                                label="توضیحات متا (Meta Description)"
                                htmlFor="meta_description"
                                error={fieldErrors.meta_description}
                            >
                                <Textarea
                                    id="meta_description"
                                    value={formData.meta_description || ""}
                                    onChange={(e) => handleInputChange("meta_description", e.target.value)}
                                    disabled={!isConsultantEditable}
                                    placeholder="توضیحات کوتاه برای نمایش در نتایج جستجوی گوگل..."
                                    rows={3}
                                />
                            </FormField>
                        </div>

                        <div className="md:col-span-2 lg:col-span-1">
                            <div className="space-y-4">
                                <Label className="text-sm font-medium">تصویر اشتراک‌گذاری (OG Image)</Label>
                                {ogImage && ogImageUrl ? (
                                    <div className="relative w-full aspect-video rounded-xl overflow-hidden group border-2 border-amber-1/20 shadow-sm">
                                        <img
                                            src={ogImageUrl}
                                            alt="OG Image"
                                            className="object-cover w-full h-full"
                                        />
                                        {isConsultantEditable && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setIsMediaModalOpen(true)}
                                                    className="mx-1"
                                                >
                                                    تغییر تصویر
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={handleRemoveOgImage}
                                                    className="mx-1"
                                                >
                                                    <X className="w-4 h-4" />
                                                    حذف
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => isConsultantEditable && setIsMediaModalOpen(true)}
                                        className={`relative flex flex-col items-center justify-center w-full aspect-video p-6 border-2 border-dashed border-amber-1/30 rounded-xl transition-all group ${isConsultantEditable ? 'cursor-pointer hover:bg-amber-1/5 hover:border-amber-1/50' : 'bg-muted'}`}
                                    >
                                        <div className="p-4 rounded-full bg-amber-1/10 text-amber-1 group-hover:scale-110 transition-transform">
                                            <UploadCloud className="w-8 h-8" />
                                        </div>
                                        <p className="mt-3 font-medium text-amber-1">انتخاب تصویر OG</p>
                                        <p className="text-xs text-font-s mt-1 text-center">
                                            تصویر مناسب برای اشتراک در شبکه‌های اجتماعی
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-amber-1/10">
                                <FormField
                                    label="عنوان اشتراک گذاری (OG Title)"
                                    htmlFor="og_title"
                                    error={fieldErrors.og_title}
                                >
                                    <Input
                                        id="og_title"
                                        value={formData.og_title || ""}
                                        onChange={(e) => handleInputChange("og_title", e.target.value)}
                                        disabled={!isConsultantEditable}
                                        placeholder="عنوان در زمان اشتراک در تلگرام، واتس‌اپ و..."
                                    />
                                </FormField>

                                <FormField
                                    label="توضیحات اشتراک گذاری (OG Description)"
                                    htmlFor="og_description"
                                    error={fieldErrors.og_description}
                                >
                                    <Textarea
                                        id="og_description"
                                        value={formData.og_description || ""}
                                        onChange={(e) => handleInputChange("og_description", e.target.value)}
                                        disabled={!isConsultantEditable}
                                        placeholder="توضیحات کوتاه برای اشتراک گذاری در شبکه‌های اجتماعی..."
                                        rows={3}
                                    />
                                </FormField>
                            </div>
                        </div>
                    </div>
                </CardWithIcon>

                {isConsultantEditable && (
                    <div className="flex justify-end gap-2 pt-4">
                        <Button onClick={handleSaveProfile} disabled={isSaving}>
                            {isSaving ? "در حال ذخیره..." : "ذخیره تغییرات"}
                        </Button>
                    </div>
                )}
            </div>

            <MediaLibraryModal
                isOpen={isMediaModalOpen}
                onClose={() => setIsMediaModalOpen(false)}
                onSelect={handleOgImageSelect}
                selectMultiple={false}
                initialFileType="image"
                context="media_library"
            />
        </TabsContent>
    );
}
