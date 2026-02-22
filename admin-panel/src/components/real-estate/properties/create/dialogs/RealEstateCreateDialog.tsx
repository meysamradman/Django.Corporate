
import { useState, type FormEvent, type ChangeEvent } from "react";
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
import { FormFieldInput } from "@/components/shared/FormField";
import { ImageSelector } from "@/components/media/selectors/ImageSelector";
import type { Media } from "@/types/shared/media";
import { Loader2 } from "lucide-react";
import { showSuccess, showError } from '@/core/toast';
import { getCrud } from '@/core/messages/ui';
import { getError } from '@/core/messages/errors';
import { generateSlug, formatSlug } from '@/core/slug/generate';
import { validateSlug } from '@/core/slug/validate';
import { MEDIA_MODULES, type MediaContextType } from "@/components/media/constants";

interface RealEstateCreateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: 'type' | 'state' | 'label' | 'tag' | 'feature';
    onSubmit: (data: { title: string; slug: string; image_id?: number; is_active?: boolean; is_public?: boolean }) => Promise<any>;
    onSuccess?: (createdItem: any) => void;
    refetchList: () => void;
    context?: MediaContextType;
    contextId?: number | string;
}

export function RealEstateCreateDialog({
    open,
    onOpenChange,
    type,
    onSubmit,
    onSuccess,
    refetchList,
    context = MEDIA_MODULES.REAL_ESTATE,
    contextId
}: RealEstateCreateDialogProps) {
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
    const [isActive, setIsActive] = useState(true);
    const [isPublic, setIsPublic] = useState(true);

    const createMutation = useMutation({
        mutationFn: (data: { title: string; slug: string; image_id?: number; is_active?: boolean; is_public?: boolean }) => onSubmit(data),
        onSuccess: (data) => {
            showSuccess(getCrud('created', { item: 'آیتم' }));
            onSuccess?.(data);
            refetchList();
            handleClose();
        },
        onError: (error: any) => {
            showError(error?.response?.data?.detail || getError('serverError'));
        }
    });

    const handleClose = () => {
        setTitle("");
        setSlug("");
        setSelectedMedia(null);
        setIsActive(true);
        setIsPublic(true);
        onOpenChange(false);
    };

    const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setTitle(value);

        const generatedSlug = generateSlug(value);
        setSlug(generatedSlug);
    };

    const handleSlugChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const formattedSlug = formatSlug(value);
        setSlug(formattedSlug);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        const slugValidation = validateSlug(slug.trim(), true);
        if (!slugValidation.isValid) {
            showError(new Error(slugValidation.error || "اسلاگ معتبر نیست"));
            return;
        }

        const submitData: { title: string; slug: string; image_id?: number; is_active?: boolean; is_public?: boolean } = {
            title: title.trim(),
            slug: slug.trim(),
            is_active: isActive,
            is_public: isPublic,
        };
        if (type === 'type' && selectedMedia?.id) {
            submitData.image_id = selectedMedia.id;
        }
        createMutation.mutate(submitData);
    };

    const typeLabels = {
        type: { title: "افزودن نوع ملک جدید", desc: "یک نوع ملک جدید (مثلاً آپارتمان) اضافه کنید" },
        state: { title: "افزودن وضعیت جدید", desc: "یک وضعیت جدید (مثلاً پیش‌فروش) اضافه کنید" },
        label: { title: "افزودن برچسب جدید", desc: "یک برچسب جدید (مثلاً فوری) اضافه کنید" },
        tag: { title: "افزودن تگ جدید", desc: "یک تگ جدید اضافه کنید" },
        feature: { title: "افزودن ویژگی جدید", desc: "یک ویژگی جدید اضافه کنید" },
    };

    const labels = typeLabels[type];

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-105">
                <DialogHeader>
                    <DialogTitle>{labels.title}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-5">
                        {type === 'type' && (
                            <div className="flex justify-center pb-1">
                                <ImageSelector
                                    selectedMedia={selectedMedia}
                                    onMediaSelect={setSelectedMedia}
                                    label=""
                                    name={title}
                                    disabled={createMutation.isPending}
                                    size="sm"
                                    placeholderColor="primary"
                                    context={context}
                                    contextId={contextId}
                                />
                            </div>
                        )}

                        <div className="space-y-4">
                            <FormFieldInput
                                label="نام"
                                id="quick-create-title"
                                placeholder="نام را وارد کنید"
                                value={title}
                                onChange={handleTitleChange}
                                disabled={createMutation.isPending}
                                required
                                autoFocus
                            />

                            <FormFieldInput
                                label="لینک (نامک)"
                                id="quick-create-slug"
                                placeholder="نامک"
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
                            disabled={!title.trim() || createMutation.isPending}
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
