import { type ChangeEvent, lazy, Suspense } from "react";
import type { UseFormReturn, Path } from "react-hook-form";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { FormFieldInput, FormFieldTextarea } from "@/components/shared/FormField";
import { Globe, Image as ImageIcon, X, AlertCircle, UploadCloud } from "lucide-react";
import { mediaService } from "@/components/media/services";
import type { Media } from "@/types/shared/media";
import type { PortfolioFormValues } from "@/components/portfolios/validations/portfolioSchema";

const MediaLibraryModal = lazy(() => import("@/components/media/modals/MediaLibraryModal").then(mod => ({ default: mod.MediaLibraryModal })));

interface PortfolioSEOSocialPreviewProps {
    isFormApproach: boolean;
    form?: UseFormReturn<PortfolioFormValues>;
    editMode: boolean;
    portfolioId?: number | string;
    ogTitleValue: string;
    ogDescriptionValue: string;
    ogImageValue: Media | null;
    isMediaModalOpen: boolean;
    setIsMediaModalOpen: (open: boolean) => void;
    handleOgTitleChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleOgDescriptionChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
    handleOgImageSelect: (media: Media | Media[] | null) => void;
    handleRemoveOgImage: () => void;
}

export function PortfolioSEOSocialPreview({
    isFormApproach,
    form,
    editMode,
    portfolioId,
    ogTitleValue,
    ogDescriptionValue,
    ogImageValue,
    isMediaModalOpen,
    setIsMediaModalOpen,
    handleOgTitleChange,
    handleOgDescriptionChange,
    handleOgImageSelect,
    handleRemoveOgImage
}: PortfolioSEOSocialPreviewProps) {
    const { register, formState } = isFormApproach && form
        ? form
        : { register: null, formState: { errors: {} as any } };

    const ogImageUrl = ogImageValue ? mediaService.getMediaUrlFromObject(ogImageValue) : "";

    return (
        <>
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 min-w-0 space-y-6">
                    <CardWithIcon
                        icon={Globe}
                        title="پیش‌نمایش Open Graph"
                        iconBgColor="bg-emerald"
                        iconColor="stroke-emerald-2"
                        cardBorderColor="border-b-emerald-1"
                    >
                        <div className="flex flex-col lg:flex-row gap-6">
                            <div className="lg:w-[35%] lg:max-w-[320px]">
                                {isFormApproach ? (
                                    <FormFieldInput
                                        label="عنوان Open Graph"
                                        id="og_title"
                                        error={(formState.errors as any)?.og_title?.message}
                                        placeholder="عنوان برای اشتراک‌گذاری در شبکه‌های اجتماعی"
                                        maxLength={70}
                                        disabled={!editMode}
                                        {...(register ? register("og_title" as Path<PortfolioFormValues>, {
                                            onChange: handleOgTitleChange
                                        }) : {})}
                                    />
                                ) : (
                                    <FormFieldInput
                                        label="عنوان Open Graph"
                                        id="og_title"
                                        error={(formState.errors as any)?.og_title?.message}
                                        placeholder="عنوان برای اشتراک‌گذاری در شبکه‌های اجتماعی"
                                        maxLength={70}
                                        disabled={!editMode}
                                        value={ogTitleValue || ""}
                                        onChange={handleOgTitleChange}
                                    />
                                )}
                            </div>

                            <div className="lg:flex-1 lg:min-w-0">
                                {isFormApproach ? (
                                    <FormFieldTextarea
                                        label="توضیحات Open Graph"
                                        id="og_description"
                                        error={(formState.errors as any)?.og_description?.message}
                                        placeholder="توضیحات برای اشتراک‌گذاری در شبکه‌های اجتماعی"
                                        rows={5}
                                        maxLength={160}
                                        disabled={!editMode}
                                        {...(register ? register("og_description" as Path<PortfolioFormValues>, {
                                            onChange: handleOgDescriptionChange
                                        }) : {})}
                                    />
                                ) : (
                                    <FormFieldTextarea
                                        label="توضیحات Open Graph"
                                        id="og_description"
                                        error={(formState.errors as any)?.og_description?.message}
                                        placeholder="توضیحات برای اشتراک‌گذاری در شبکه‌های اجتماعی"
                                        rows={5}
                                        maxLength={160}
                                        disabled={!editMode}
                                        value={ogDescriptionValue || ""}
                                        onChange={handleOgDescriptionChange}
                                    />
                                )}
                            </div>
                        </div>
                    </CardWithIcon>
                </div>

                <div className="w-full lg:w-[420px] lg:shrink-0">
                    <CardWithIcon
                        icon={ImageIcon}
                        title="تصویر Open Graph"
                        iconBgColor="bg-emerald"
                        iconColor="stroke-emerald-2"
                        cardBorderColor={(formState.errors as any)?.og_image ? 'border-b-red-1' : 'border-b-emerald-1'}
                        className="lg:sticky lg:top-20"
                    >
                        {ogImageValue && ogImageUrl ? (
                            <div className="relative w-full aspect-video rounded-lg overflow-hidden group border">
                                <img
                                    src={ogImageUrl}
                                    alt={ogImageValue.alt_text || "تصویر Open Graph"}
                                    className="object-cover w-full h-full"
                                />
                                <div className="absolute inset-0 bg-static-b/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsMediaModalOpen(true)}
                                        className="mx-1"
                                        disabled={!editMode}
                                    >
                                        تغییر تصویر
                                    </Button>

                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleRemoveOgImage}
                                        className="mx-1"
                                        disabled={!editMode}
                                    >
                                        <X className="w-4 h-4" />
                                        حذف
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => editMode && setIsMediaModalOpen(true)}
                                className={`relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-blue-1 transition-colors ${!editMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <UploadCloud className="w-12 h-12 text-font-s" />
                                <p className="font-semibold">انتخاب تصویر Open Graph</p>
                                <p className="text-font-s text-center">
                                    برای انتخاب از کتابخانه کلیک کنید
                                </p>
                            </div>
                        )}

                        {formState?.errors && (formState.errors as any)?.og_image?.message && (
                            <div className="flex items-start gap-2 text-red-2 mt-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{String((formState.errors as any).og_image.message)}</span>
                            </div>
                        )}
                    </CardWithIcon>
                </div>
            </div>

            <Suspense fallback={null}>
                <MediaLibraryModal
                    isOpen={isMediaModalOpen}
                    onClose={() => setIsMediaModalOpen(false)}
                    onSelect={handleOgImageSelect}
                    selectMultiple={false}
                    initialFileType="image"
                    context="portfolio"
                    contextId={portfolioId}
                />
            </Suspense>
        </>
    );
}
