import { useState, useEffect } from "react";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { Textarea } from "@/components/elements/Textarea";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/elements/Dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/elements/AlertDialog";
import { settingsApi } from "@/api/settings/settings";
import type { Slider, SliderCreate, SliderUpdate } from "@/types/settings/generalSettings";
import { showError, showSuccess } from "@/core/toast";
import { Plus, Edit, Trash2, Sliders as SliderIcon, Loader2, Image as ImageIcon, Link as LinkIcon, Video } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/elements/Table";
import { DataTableRowActions } from "@/components/tables/DataTableRowActions";
import { Skeleton } from "@/components/elements/Skeleton";
import { Switch } from "@/components/elements/Switch";
import { MediaSelector } from "@/components/media/selectors/MediaSelector";
import { MediaThumbnail } from "@/components/media/base/MediaThumbnail";
import type { Media } from "@/types/shared/media";

export function SlidersSection() {
    const [sliders, setSliders] = useState<Slider[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingSlider, setEditingSlider] = useState<Slider | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [sliderToDelete, setSliderToDelete] = useState<number | null>(null);

    // Form States
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [link, setLink] = useState("");
    const [order, setOrder] = useState(0);
    const [selectedImage, setSelectedImage] = useState<Media | null>(null);
    const [selectedVideo, setSelectedVideo] = useState<Media | null>(null);
    const [isActive, setIsActive] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSliders();
    }, []);

    const fetchSliders = async () => {
        try {
            setLoading(true);
            const data = await settingsApi.getSliders();
            setSliders(data);
        } catch (error) {
            showError("خطا در دریافت اسلایدرها");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (slider?: Slider) => {
        if (slider) {
            setEditingSlider(slider);
            setTitle(slider.title);
            setDescription(slider.description);
            setLink(slider.link);
            setOrder(slider.order);
            setIsActive(slider.is_active);
            // In a real scenario, we might need to fetch the full media object if the slider 
            // only returned IDs or if we need to reconstruct the Media object from the nested data.
            // Assuming slider.image and slider.video are nested objects from the API now.
            setSelectedImage(slider.image as unknown as Media || null);
            setSelectedVideo(slider.video as unknown as Media || null);
        } else {
            setEditingSlider(null);
            setTitle("");
            setDescription("");
            setLink("");
            setOrder(0);
            setIsActive(true);
            setSelectedImage(null);
            setSelectedVideo(null);
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingSlider(null);
        setTitle("");
        setDescription("");
        setLink("");
        setOrder(0);
        setIsActive(true);
        setSelectedImage(null);
        setSelectedVideo(null);
    };

    const handleSave = async () => {
        if (!title.trim()) {
            showError("عنوان اسلایدر الزامی است");
            return;
        }

        try {
            setSaving(true);

            const commonData = {
                title,
                description,
                link,
                order,
                is_active: isActive,
            };

            const imageId = selectedImage ? selectedImage.id : null;
            const videoId = selectedVideo ? selectedVideo.id : null;

            if (editingSlider) {
                const updateData: SliderUpdate = {
                    ...commonData,
                    image_id: imageId,
                    video_id: videoId
                };
                await settingsApi.updateSlider(editingSlider.id, updateData);
                showSuccess("اسلایدر با موفقیت به‌روزرسانی شد");
            } else {
                const createData: SliderCreate = {
                    ...commonData,
                    image_id: imageId,
                    video_id: videoId
                }
                await settingsApi.createSlider(createData);
                showSuccess("اسلایدر با موفقیت ایجاد شد");
            }

            handleCloseDialog();
            await fetchSliders();
        } catch (error) {
            showError("خطا در ذخیره اسلایدر");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (id: number) => {
        setSliderToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!sliderToDelete) return;

        try {
            await settingsApi.deleteSlider(sliderToDelete);
            showSuccess("اسلایدر با موفقیت حذف شد");
            await fetchSliders();
            setDeleteDialogOpen(false);
            setSliderToDelete(null);
        } catch (error) {
            showError("خطا در حذف اسلایدر");
        }
    };

    if (loading) {
        return (
            <CardWithIcon
                icon={SliderIcon}
                title="مدیریت اسلایدرها"
                iconBgColor="bg-purple"
                iconColor="stroke-purple-2"
                borderColor="border-b-purple-1"
            >
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-24 w-full" />
                        ))}
                    </div>
                </div>
            </CardWithIcon>
        );
    }

    return (
        <>
            <CardWithIcon
                icon={SliderIcon}
                title="مدیریت اسلایدرها"
                iconBgColor="bg-purple"
                iconColor="stroke-purple-2"
                borderColor="border-b-purple-1"
                className="hover:shadow-lg transition-all duration-300"
                headerClassName="pb-3"
                titleExtra={
                    <Button onClick={() => handleOpenDialog()}>
                        <Plus />
                        افزودن اسلایدر
                    </Button>
                }
            >
                {sliders.length === 0 ? (
                    <div className="text-center py-12 text-font-s">
                        اسلایدری ثبت نشده است
                    </div>
                ) : (
                    <div className="rounded-lg border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-bg/50 hover:bg-bg/50">
                                    <TableHead className="w-[80px] text-right">تصویر</TableHead>
                                    <TableHead className="text-right">عنوان</TableHead>
                                    <TableHead className="text-right">وضعیت</TableHead>
                                    <TableHead className="w-24 text-right">ترتیب</TableHead>
                                    <TableHead className="w-[60px] text-center"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sliders.map((slider) => (
                                    <TableRow key={slider.id} className="hover:bg-bg/50 transition-colors">
                                        <TableCell>
                                            <div className="w-16 h-10 rounded-md overflow-hidden border border-br relative">
                                                {slider.image ? (
                                                    <MediaThumbnail
                                                        media={slider.image}
                                                        className="w-full h-full object-cover"
                                                        fill
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-bg flex items-center justify-center">
                                                        <ImageIcon className="h-4 w-4 text-font-s" />
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col">
                                                <span className="font-medium">{slider.title}</span>
                                                {slider.video && (
                                                    <span className="text-xs text-blue-1 flex items-center gap-1 mt-1">
                                                        <Video className="w-3 h-3" />
                                                        دارای ویدئو
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {slider.is_active ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
                                                    فعال
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10">
                                                    غیرفعال
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-bg rounded-md">
                                                {slider.order}
                                            </span>
                                        </TableCell>
                                        <TableCell className="w-[60px]">
                                            <div className="flex items-center justify-center">
                                                <DataTableRowActions
                                                    row={{ original: slider } as any}
                                                    actions={[
                                                        {
                                                            label: "ویرایش",
                                                            icon: <Edit className="h-4 w-4" />,
                                                            onClick: () => handleOpenDialog(slider),
                                                        },
                                                        {
                                                            label: "حذف",
                                                            icon: <Trash2 className="h-4 w-4" />,
                                                            onClick: () => handleDeleteClick(slider.id),
                                                            isDestructive: true,
                                                        },
                                                    ]}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardWithIcon>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingSlider ? "ویرایش اسلایدر" : "افزودن اسلایدر جدید"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">عنوان *</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="عنوان اسلاید"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">توضیحات</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="توضیحات کوتاه زیر عنوان"
                                className="h-24"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <MediaSelector
                                    label="تصویر پس‌زمینه"
                                    selectedMedia={selectedImage}
                                    onMediaSelect={setSelectedImage}
                                    context="media_library"
                                    initialFileType="image"
                                />
                            </div>

                            <div className="space-y-2">
                                <MediaSelector
                                    label="ویدئو (اختیاری)"
                                    selectedMedia={selectedVideo}
                                    onMediaSelect={setSelectedVideo}
                                    context="media_library"
                                    initialFileType="video"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="link">لینک (اختیاری)</Label>
                                <div className="relative">
                                    <LinkIcon className="absolute right-3 top-3 h-4 w-4 text-font-s" />
                                    <Input
                                        id="link"
                                        value={link}
                                        onChange={(e) => setLink(e.target.value)}
                                        placeholder="https://..."
                                        className="pr-9"
                                        dir="ltr"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="order">ترتیب نمایش</Label>
                                <Input
                                    id="order"
                                    type="number"
                                    value={order}
                                    onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 space-x-reverse">
                            <Switch
                                id="is_active"
                                checked={isActive}
                                onCheckedChange={setIsActive}
                            />
                            <Label htmlFor="is_active">اسلایدر فعال باشد</Label>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={handleCloseDialog}>
                                انصراف
                            </Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? (
                                    <>
                                        <Loader2 className="animate-spin" />
                                        در حال ذخیره...
                                    </>
                                ) : (
                                    "ذخیره تغییرات"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>حذف اسلایدر</AlertDialogTitle>
                        <AlertDialogDescription>
                            آیا از حذف این اسلایدر اطمینان دارید؟ این عمل غیرقابل بازگشت است.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>انصراف</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
