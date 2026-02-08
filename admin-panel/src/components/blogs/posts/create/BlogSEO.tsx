import { useState, type ChangeEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { TabsContent } from "@/components/elements/Tabs";
import { Search } from "lucide-react";
import type { BlogFormValues } from "@/components/blogs/validations/blogSchema";
import type { Media } from "@/types/shared/media";
import { BlogSEOMetaFields } from "./seo/BlogSEOMetaFields";
import { BlogSEOSocialPreview } from "./seo/BlogSEOSocialPreview";

interface SEOTabFormProps {
    form: UseFormReturn<BlogFormValues>;
    editMode: boolean;
    blogId?: number | string;
}

interface SEOTabManualProps {
    formData: any;
    handleInputChange: (field: string, value: any) => void;
    editMode: boolean;
    blogId?: number | string;
}

type SEOTabProps = SEOTabFormProps | SEOTabManualProps;

export default function BlogSEO(props: SEOTabProps) {
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

    const isFormApproach = 'form' in props;

    const form = isFormApproach ? props.form : undefined;
    const watch = isFormApproach ? props.form.watch : null;
    const setValue = isFormApproach ? props.form.setValue : null;

    const blogId = props.blogId;
    const editMode = props.editMode;

    const {
        formData,
        handleInputChange
    } = isFormApproach ? {} as any : props;

    const metaTitleValue = isFormApproach ? watch?.("meta_title") : formData?.meta_title;
    const metaDescriptionValue = isFormApproach ? watch?.("meta_description") : formData?.meta_description;
    const ogTitleValue = isFormApproach ? watch?.("og_title") : formData?.og_title;
    const ogDescriptionValue = isFormApproach ? watch?.("og_description") : formData?.og_description;
    const canonicalUrlValue = isFormApproach ? watch?.("canonical_url") : formData?.canonical_url;
    const robotsMetaValue = isFormApproach ? watch?.("robots_meta") : formData?.robots_meta;
    const ogImageValue = isFormApproach ? watch?.("og_image") : formData?.og_image;

    const handleMetaTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (!isFormApproach) handleInputChange?.("meta_title", e.target.value);
    };

    const handleMetaDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        if (!isFormApproach) handleInputChange?.("meta_description", e.target.value);
    };

    const handleOgTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (!isFormApproach) handleInputChange?.("og_title", e.target.value);
    };

    const handleOgDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        if (!isFormApproach) handleInputChange?.("og_description", e.target.value);
    };

    const handleCanonicalUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (!isFormApproach) handleInputChange?.("canonical_url", e.target.value);
    };

    const handleRobotsMetaChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (!isFormApproach) handleInputChange?.("robots_meta", e.target.value);
    };

    const handleOgImageSelect = (media: Media | Media[] | null) => {
        const selected = Array.isArray(media) ? media[0] || null : media;

        if (isFormApproach) {
            setValue?.("og_image", selected, { shouldValidate: true });
        } else {
            handleInputChange?.("og_image", selected);
        }

        setIsMediaModalOpen(false);
    };

    const handleRemoveOgImage = () => {
        if (isFormApproach) {
            setValue?.("og_image", null, { shouldValidate: true });
        } else {
            handleInputChange?.("og_image", null);
        }
    };

    return (
        <TabsContent value="seo" className="mt-0 space-y-6">
            <div className="space-y-6">
                <CardWithIcon
                    icon={Search}
                    title="برچسب‌های Meta"
                    iconBgColor="bg-emerald"
                    iconColor="stroke-emerald-2"
                    cardBorderColor="border-b-emerald-1"
                >
                    <BlogSEOMetaFields
                        isFormApproach={isFormApproach}
                        form={form}
                        editMode={editMode}
                        metaTitleValue={metaTitleValue}
                        metaDescriptionValue={metaDescriptionValue}
                        canonicalUrlValue={canonicalUrlValue}
                        robotsMetaValue={robotsMetaValue}
                        handleMetaTitleChange={handleMetaTitleChange}
                        handleMetaDescriptionChange={handleMetaDescriptionChange}
                        handleCanonicalUrlChange={handleCanonicalUrlChange}
                        handleRobotsMetaChange={handleRobotsMetaChange}
                    />
                </CardWithIcon>

                <BlogSEOSocialPreview
                    isFormApproach={isFormApproach}
                    form={form}
                    editMode={editMode}
                    blogId={blogId}
                    ogTitleValue={ogTitleValue}
                    ogDescriptionValue={ogDescriptionValue}
                    ogImageValue={ogImageValue}
                    isMediaModalOpen={isMediaModalOpen}
                    setIsMediaModalOpen={setIsMediaModalOpen}
                    handleOgTitleChange={handleOgTitleChange}
                    handleOgDescriptionChange={handleOgDescriptionChange}
                    handleOgImageSelect={handleOgImageSelect}
                    handleRemoveOgImage={handleRemoveOgImage}
                />
            </div>
        </TabsContent>
    );
}