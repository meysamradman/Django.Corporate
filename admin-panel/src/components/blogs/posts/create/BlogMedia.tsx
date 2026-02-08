import { useState, lazy, Suspense } from "react";
import type { UseFormReturn } from "react-hook-form";
import { TabsContent } from "@/components/elements/Tabs";
import type { Media } from "@/types/shared/media";
import type { BlogFormValues } from "@/components/blogs/validations/blogSchema";
import type { BlogMedia as BlogMediaType } from "@/types/blog/blogMedia";
import { getModuleMediaCount } from "@/components/media/utils/genericMediaUtils";
import { MEDIA_MODULES } from "@/components/media/constants";
import { Loader } from "@/components/elements/Loader";
import { BlogMediaFeatured } from "./media/BlogMediaFeatured";
import { BlogMediaImages } from "./media/BlogMediaImages";
import { BlogMediaOther } from "./media/BlogMediaOther";

const MediaLibraryModal = lazy(() => import("@/components/media/modals/MediaLibraryModal").then(mod => ({ default: mod.MediaLibraryModal })));

interface MediaTabFormProps {
    form: UseFormReturn<BlogFormValues>;
    blogMedia: BlogMediaType;
    setBlogMedia: (media: BlogMediaType) => void;
    editMode: boolean;
    blogId?: number | string;
}

interface MediaTabManualProps {
    blogMedia: BlogMediaType;
    setBlogMedia: (media: BlogMediaType) => void;
    editMode: boolean;
    featuredImage?: Media | null;
    onFeaturedImageChange?: (media: Media | null) => void;
    blogId?: number | string;
}

type MediaTabProps = MediaTabFormProps | MediaTabManualProps;

export default function BlogMedia(props: MediaTabProps) {
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

    const isFormApproach = 'form' in props;

    const setValue = isFormApproach ? props.form.setValue : null;
    const watch = isFormApproach ? props.form.watch : null;

    const {
        blogMedia,
        setBlogMedia,
        editMode,
        featuredImage: manualFeaturedImage,
        onFeaturedImageChange,
        blogId
    } = isFormApproach
            ? {
                blogMedia: props.blogMedia,
                setBlogMedia: props.setBlogMedia,
                editMode: props.editMode,
                featuredImage: undefined,
                onFeaturedImageChange: undefined,
                blogId: props.blogId
            }
            : props;

    const formFeaturedImage = isFormApproach ? watch?.("featuredImage") : undefined;
    const currentFeaturedImage = isFormApproach ? formFeaturedImage : manualFeaturedImage || blogMedia?.featuredImage;

    const handleFeaturedImageSelect = (media: Media | Media[] | null) => {
        const selected = Array.isArray(media) ? media[0] || null : media;

        if (isFormApproach) {
            setValue?.("featuredImage", selected, { shouldValidate: true });
        } else {
            onFeaturedImageChange?.(selected);
        }

        setBlogMedia?.({
            ...blogMedia,
            featuredImage: selected
        });

        setIsMediaModalOpen(false);
    };

    const handleRemoveFeaturedImage = () => {
        if (isFormApproach) {
            setValue?.("featuredImage", null, { shouldValidate: true });
        } else {
            onFeaturedImageChange?.(null);
        }

        setBlogMedia?.({
            ...blogMedia,
            featuredImage: null
        });
    };

    const totalMediaCount = getModuleMediaCount(blogMedia);

    return (
        <TabsContent value="media" className="mt-0 space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 min-w-0 space-y-6">
                    <BlogMediaImages
                        blogMedia={blogMedia}
                        setBlogMedia={setBlogMedia}
                        editMode={editMode}
                        blogId={blogId}
                        totalMediaCount={totalMediaCount}
                    />

                    <BlogMediaOther
                        blogMedia={blogMedia}
                        setBlogMedia={setBlogMedia}
                        editMode={editMode}
                        blogId={blogId}
                        totalMediaCount={totalMediaCount}
                    />
                </div>

                <div className="w-full lg:w-[380px] lg:shrink-0">
                    <BlogMediaFeatured
                        currentFeaturedImage={currentFeaturedImage}
                        editMode={editMode}
                        errors={isFormApproach ? props.form.formState.errors : {}}
                        setIsMediaModalOpen={setIsMediaModalOpen}
                        handleRemoveFeaturedImage={handleRemoveFeaturedImage}
                    />
                </div>
            </div>

            <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader /></div>}>
                <MediaLibraryModal
                    isOpen={isMediaModalOpen}
                    onClose={() => setIsMediaModalOpen(false)}
                    onSelect={handleFeaturedImageSelect}
                    selectMultiple={false}
                    initialFileType="image"
                    context={MEDIA_MODULES.BLOG}
                    contextId={blogId}
                />
            </Suspense>
        </TabsContent>
    );
}