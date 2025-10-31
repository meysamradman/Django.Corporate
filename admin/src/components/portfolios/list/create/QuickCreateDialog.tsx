"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/elements/Dialog";
import { Button } from "@/components/elements/Button";
import { FormFieldInput } from "@/components/forms/FormField";
import { ImageSmallSelector } from "@/components/media/selectors/ImageSmallSelector";
import { Media } from "@/types/shared/media";
import { Loader2 } from "lucide-react";
import { showSuccessToast, showErrorToast } from "@/core/config/errorHandler";
import { generateSlug } from '@/core/utils/slugUtils';

interface QuickCreateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: 'category' | 'tag' | 'option';
    onSubmit: (data: { name: string; slug: string; image_id?: number }) => Promise<any>;
    onSuccess?: (createdItem: any) => void;
    refetchList: () => void;
}

export function QuickCreateDialog({ 
    open, 
    onOpenChange, 
    type, 
    onSubmit, 
    onSuccess, 
    refetchList 
}: QuickCreateDialogProps) {
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
    
    const createMutation = useMutation({
        mutationFn: (data: { name: string; slug: string; image_id?: number }) => onSubmit(data),
        onSuccess: (data) => {
            showSuccessToast(`با موفقیت اضافه شد`);
            onSuccess?.(data);
            refetchList();
            handleClose();
        },
        onError: (error: any) => {
            console.error(`Error creating ${type}:`, error);
            showErrorToast(error?.response?.data?.detail || "خطا در اضافه کردن");
        }
    });

    const handleClose = () => {
        setName("");
        setSlug("");
        setSelectedMedia(null);
        onOpenChange(false);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setName(value);
        
        // Auto-generate slug whenever name changes
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
        const submitData: { name: string; slug: string; image_id?: number } = {
            name: name.trim(),
            slug: slug.trim(),
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
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-right">{labels.title}</DialogTitle>
                    <DialogDescription className="text-right">{labels.desc}</DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        {type === 'category' && (
                            <ImageSmallSelector
                                selectedMedia={selectedMedia}
                                onMediaSelect={setSelectedMedia}
                                label="تصویر دسته‌بندی"
                                name={name}
                                disabled={createMutation.isPending}
                            />
                        )}

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

                    <DialogFooter className="gap-2">
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
                                    <Loader2 className="w-4 h-4 me-2 animate-spin" />
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

