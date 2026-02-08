
import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import { TabsContent } from "@/components/elements/Tabs";
import { generateSlug } from '@/core/slug/generate';
import type { BlogCategory } from "@/types/blog/category/blogCategory";
import type { BlogTag } from "@/types/blog/tags/blogTag";
import type { BlogFormValues } from "@/components/blogs/validations/blogSchema";
import { BlogContent } from "./info/BlogContent";
import { BlogSidebar } from "./info/BlogSidebar";

interface BaseInfoTabFormProps {
    form: UseFormReturn<BlogFormValues>;
    editMode: boolean;
    blogId?: number | string;
}

interface BaseInfoTabManualProps {
    formData: any;
    handleInputChange: (field: string, value: any) => void;
    editMode: boolean;
    selectedCategories: BlogCategory[];
    selectedTags: BlogTag[];
    onCategoryToggle: (category: BlogCategory) => void;
    onCategoryRemove: (categoryId: number) => void;
    onTagToggle: (tag: BlogTag) => void;
    onTagRemove: (tagId: number) => void;
    blogId?: number | string;
}

type BaseInfoTabProps = BaseInfoTabFormProps | BaseInfoTabManualProps;

export default function BaseInfoTab(props: BaseInfoTabProps) {
    const isFormApproach = 'form' in props;
    const form = isFormApproach ? (props as BaseInfoTabFormProps).form : undefined;
    const { watch, setValue } = isFormApproach && form
        ? form
        : { watch: null, setValue: null };

    const formData = isFormApproach ? null : (props as any).formData;
    const handleInputChange = isFormApproach ? null : (props as any).handleInputChange;
    const editMode = isFormApproach ? (props as any).editMode : (props as any).editMode;
    const selectedCategories = isFormApproach ? [] : (props as any).selectedCategories || [];
    const selectedTags = isFormApproach ? [] : (props as any).selectedTags || [];
    const onCategoryToggle = isFormApproach ? null : (props as any).onCategoryToggle;
    const onCategoryRemove = isFormApproach ? null : (props as any).onCategoryRemove;
    const onTagToggle = isFormApproach ? null : (props as any).onTagToggle;
    const onTagRemove = isFormApproach ? null : (props as any).onTagRemove;
    const blogId = isFormApproach ? props.blogId : props.blogId;

    const nameValue = isFormApproach ? watch?.("name") : formData?.name;

    useEffect(() => {
        if (isFormApproach && nameValue) {
            const slug = generateSlug(nameValue);
            setValue?.("slug", slug);
        }
    }, [nameValue, setValue, isFormApproach]);

    return (
        <TabsContent value="account" className="mt-0 space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 min-w-0">
                    <div className="space-y-6">
                        <BlogContent
                            form={form}
                            formData={formData}
                            handleInputChange={handleInputChange}
                            editMode={editMode}
                            isFormApproach={isFormApproach}
                        />
                    </div>
                </div>

                <div className="w-full lg:w-[420px] lg:shrink-0">
                    <BlogSidebar
                        form={form}
                        formData={formData}
                        handleInputChange={handleInputChange}
                        editMode={editMode}
                        isFormApproach={isFormApproach}
                        selectedCategories={selectedCategories}
                        selectedTags={selectedTags}
                        onCategoryToggle={onCategoryToggle}
                        onCategoryRemove={onCategoryRemove}
                        onTagToggle={onTagToggle}
                        onTagRemove={onTagRemove}
                        blogId={blogId}
                    />
                </div>
            </div>
        </TabsContent>
    );
}