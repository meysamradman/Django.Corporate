import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { Image as ImageIcon, X, AlertCircle } from "lucide-react";
import { mediaService } from "@/components/media/services";
import type { Media } from "@/types/shared/media";

interface BlogMediaFeaturedProps {
    currentFeaturedImage: Media | null;
    editMode: boolean;
    errors?: any;
    setIsMediaModalOpen: (open: boolean) => void;
    handleRemoveFeaturedImage: () => void;
}

export function BlogMediaFeatured({
    currentFeaturedImage,
    editMode,
    errors,
    setIsMediaModalOpen,
    handleRemoveFeaturedImage
}: BlogMediaFeaturedProps) {
    return (
        <CardWithIcon
            icon={ImageIcon}
            title={
                <>
                    تصویر شاخص
                    <span className="text-red-2">*</span>
                </>
            }
            iconBgColor="bg-indigo-0"
            iconColor="stroke-indigo-1"
            borderColor={errors?.featuredImage ? 'border-b-red-1' : 'border-b-indigo-1'}
            className="lg:sticky lg:top-20"
        >
            <div className="space-y-4">
                {currentFeaturedImage ? (
                    <div className="relative group aspect-4/3 rounded-2xl overflow-hidden border border-br shadow-sm bg-muted/5">
                        <img
                            src={mediaService.getMediaUrlFromObject(currentFeaturedImage)}
                            alt={currentFeaturedImage.alt_text || "تصویر شاخص"}
                            className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                        />

                        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                            <div className="bg-black/40 backdrop-blur-md rounded-xl p-3 border border-wt/10">
                                <p className="text-static-w text-[11px] font-bold truncate">
                                    {currentFeaturedImage.title || currentFeaturedImage.original_file_name}
                                </p>
                                <div className="flex items-center gap-2 mt-1 opacity-70">
                                    <span className="text-static-w text-[9px] uppercase font-bold">
                                        {currentFeaturedImage.file_size ? `${(currentFeaturedImage.file_size / 1024 / 1024).toFixed(1)} MB` : 'Size Unknown'}
                                    </span>
                                    <span className="w-0.5 h-0.5 rounded-full bg-wt" />
                                    <span className="text-static-w text-[9px] uppercase font-bold">
                                        {currentFeaturedImage.mime_type?.split('/').pop()?.toUpperCase() || 'IMAGE'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsMediaModalOpen(true)}
                                className="bg-wt/10 border-wt/20 text-static-w hover:bg-wt/25 backdrop-blur-md h-9 px-4 text-[11px] font-bold gap-2"
                                disabled={!editMode}
                            >
                                تغییر تصویر
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleRemoveFeaturedImage}
                                className="h-9 w-9 p-0 shadow-lg"
                                disabled={!editMode}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="absolute top-3 right-3 px-3 py-1.5 bg-indigo shadow-xl ring-4 ring-indigo/20 text-static-w text-[9px] font-black rounded-full uppercase tracking-widest">
                            شاخص
                        </div>
                    </div>
                ) : (
                    <div
                        onClick={() => editMode && setIsMediaModalOpen(true)}
                        className={`relative flex flex-col items-center justify-center w-full aspect-4/3 border-2 border-dashed border-br rounded-2xl cursor-pointer hover:border-indigo-1/40 hover:bg-indigo-0/5 transition-all duration-300 group ${!editMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <div className="w-16 h-16 rounded-full bg-indigo-0 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <ImageIcon className="w-8 h-8 text-indigo-1" />
                        </div>
                        <p className="font-bold text-font-p">انتخاب تصویر اصلی</p>
                        <p className="text-font-xs text-font-s/60 mt-1">جهت انتخاب از کتابخانه کلیک کنید</p>

                        <div className="absolute inset-4 border border-indigo-1/5 rounded-xl pointer-events-none" />
                    </div>
                )}

                {errors?.featuredImage?.message && (
                    <div className="flex items-start gap-2 text-red-2 text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{String(errors.featuredImage.message)}</span>
                    </div>
                )}
            </div>
        </CardWithIcon>
    );
}
