"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/elements/Dialog";
import { Button } from "@/components/elements/Button";
import { Label } from "@/components/elements/Label";
import { Switch } from "@/components/elements/Switch";
import { FormFieldInput } from "@/components/forms/FormField";
import { ImageSmallSelector } from "@/components/media/selectors/ImageSmallSelector";
import { Media } from "@/types/shared/media";
import { Loader2 } from "lucide-react";
import { showSuccess, showError } from '@/core/toast';
import { generateSlug } from '@/components/shared/utils/slugUtils';

interface QuickCreateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: 'category' | 'tag' | 'option';
    onSubmit: (data: { name: string; slug: string; image_id?: number; is_active?: boolean; is_public?: boolean }) => Promise<any>;
    onSuccess?: (createdItem: any) => void;
    refetchList: () => void;
    context?: 'media_library' | 'portfolio' | 'blog';
    contextId?: number | string;
}

export function QuickCreateDialog({ 
    open, 
    onOpenChange, 
    type, 
    onSubmit, 
    onSuccess, 
    refetchList,
    context = 'portfolio',
    contextId
}: QuickCreateDialogProps) {
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
    const [isActive, setIsActive] = useState(true);
    const [isPublic, setIsPublic] = useState(true);
    
    const createMutation = useMutation({
        mutationFn: (data: { name: string; slug: string; image_id?: number; is_active?: boolean; is_public?: boolean }) => onSubmit(data),
        onSuccess: (data) => {
            showSuccess(`با موفقیت اضافه شد`);
            onSuccess?.(data);
            refetchList();
            handleClose();
        },
        onError: (error: any) => {
            showError(error?.response?.data?.detail || "خطا در اضافه کردن");
        }
    });

    const handleClose = () => {
        setName("");
        setSlug("");
        setSelectedMedia(null);
        setIsActive(true);
        setIsPublic(true);
        onOpenChange(false);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setName(value);
        
        const generatedSlug = generateSlug(value);
        setSlug(generatedSlug);
    };

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const formattedSlug = generateSlug(value);
        setSlug(formattedSlug);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        const submitData: { name: string; slug: string; image_id?: number; is_active?: boolean; is_public?: boolean } = {
            name: name.trim(),
            slug: slug.trim(),
            is_active: isActive,
            is_public: isPublic,
        };
        if (type === 'category' && selectedMedia?.id) {
            submitData.image_id = selectedMedia.id;
        }
        createMutation.mutate(submitData);
    };

    const typeLabels = {
        category: { title: "افزودن دسته‌بندی جدید", desc: "یک دسته‌بندی جدید اضافه کنید" },
        tag: { title: "افزودن تگ جدید", desc: "یک تگ جدید اضافه کنید" },
        option: { title: "افزودن گزینه جدید", desc: "یک گزینه جدید اضافه کنید" },
    };

    const labels = typeLabels[type];

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                    <DialogTitle>{labels.title}</DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit}>
                    <div className="space-y-5">
                        {type === 'category' && (
                            <div className="flex justify-center pb-1">
                                <ImageSmallSelector
                                    selectedMedia={selectedMedia}
                                    onMediaSelect={setSelectedMedia}
                                    label=""
                                    name={name}
                                    disabled={createMutation.isPending}
                                    context={context}
                                    contextId={contextId}
                                />
                            </div>
                        )}

                        <div className="space-y-4">
                            <FormFieldInput
                                label="نام"
                                id="quick-create-name"
                                placeholder="نام را وارد کنید"
                                value={name}
                                onChange={handleNameChange}
                                disabled={createMutation.isPending}
                                required
                                autoFocus
                            />

                            <FormFieldInput
                                label="لینک (اسلاگ)"
                                id="quick-create-slug"
                                placeholder="اسلاگ را وارد کنید"
                                value={slug}
                                onChange={handleSlugChange}
                                disabled={createMutation.isPending}
                            />
                        </div>

                        <div className="flex items-center gap-6 pt-1 pb-1">
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="is_active"
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                    disabled={createMutation.isPending}
                                />
                                <Label htmlFor="is_active" className="cursor-pointer">فعال</Label>
                            </div>

                            <div className="flex items-center gap-2">
                                <Switch
                                    id="is_public"
                                    checked={isPublic}
                                    onCheckedChange={setIsPublic}
                                    disabled={createMutation.isPending}
                                />
                                <Label htmlFor="is_public" className="cursor-pointer">عمومی</Label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={createMutation.isPending}
                        >
                            انصراف
                        </Button>
                        <Button
                            type="submit"
                            disabled={!name.trim() || createMutation.isPending}
                        >
                            {createMutation.isPending ? (
                                <>
                                    <Loader2 className="animate-spin" />
                                    در حال افزودن...
                                </>
                            ) : (
                                "افزودن"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

