"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
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
import { MediaSelector } from "@/components/media/selectors/MediaSelector";
import { settingsApi, SocialMedia } from "@/api/settings/general/route";
import { toast } from "@/components/elements/Sonner";
import { Plus, Edit, Trash2, Share2, Loader2 } from "lucide-react";
import { Media } from "@/types/shared/media";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/elements/Table";

export function SocialMediaSection() {
    const [socialMedias, setSocialMedias] = useState<SocialMedia[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingSocialMedia, setEditingSocialMedia] = useState<SocialMedia | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [socialMediaToDelete, setSocialMediaToDelete] = useState<number | null>(null);
    
    const [name, setName] = useState("");
    const [url, setUrl] = useState("");
    const [order, setOrder] = useState(0);
    const [icon, setIcon] = useState<Media | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSocialMedias();
    }, []);

    const fetchSocialMedias = async () => {
        try {
            setLoading(true);
            const data = await settingsApi.getSocialMedias();
            setSocialMedias(data);
        } catch (error) {
            console.error("Error fetching social medias:", error);
            toast.error("خطا در دریافت شبکه‌های اجتماعی");
        } finally {
            setLoading(false);
        }
    };

    const convertImageMediaToMedia = (imageMedia: any): Media => {
        return {
            id: imageMedia.id,
            public_id: imageMedia.public_id,
            title: imageMedia.title || "",
            file_url: imageMedia.file_url,
            file_size: imageMedia.file_size,
            mime_type: imageMedia.mime_type,
            alt_text: imageMedia.alt_text || "",
            is_active: imageMedia.is_active,
            created_at: imageMedia.created_at,
            updated_at: imageMedia.updated_at,
            created_by: null,
            updated_by: null,
            media_type: imageMedia.media_type || "image",
            cover_image: null,
        };
    };

    const handleOpenDialog = (socialMedia?: SocialMedia) => {
        if (socialMedia) {
            setEditingSocialMedia(socialMedia);
            setName(socialMedia.name);
            setUrl(socialMedia.url);
            setOrder(socialMedia.order);
            if (socialMedia.icon_data) {
                setIcon(convertImageMediaToMedia(socialMedia.icon_data));
            } else {
                setIcon(null);
            }
        } else {
            setEditingSocialMedia(null);
            setName("");
            setUrl("");
            setOrder(0);
            setIcon(null);
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingSocialMedia(null);
        setName("");
        setUrl("");
        setOrder(0);
        setIcon(null);
    };

    const handleSave = async () => {
        if (!name.trim() || !url.trim()) {
            toast.error("نام و لینک الزامی هستند");
            return;
        }

        try {
            setSaving(true);
            
            if (editingSocialMedia) {
                await settingsApi.updateSocialMedia(editingSocialMedia.id, {
                    name: name,
                    url: url,
                    order,
                    icon: icon?.id || null,
                });
                toast.success("شبکه اجتماعی با موفقیت به‌روزرسانی شد");
            } else {
                await settingsApi.createSocialMedia({
                    name: name,
                    url: url,
                    order,
                    icon: icon?.id || null,
                });
                toast.success("شبکه اجتماعی با موفقیت ایجاد شد");
            }
            
            handleCloseDialog();
            await fetchSocialMedias();
        } catch (error) {
            console.error("Error saving social media:", error);
            toast.error("خطا در ذخیره شبکه اجتماعی");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (id: number) => {
        setSocialMediaToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!socialMediaToDelete) return;

        try {
            await settingsApi.deleteSocialMedia(socialMediaToDelete);
            toast.success("شبکه اجتماعی با موفقیت حذف شد");
            await fetchSocialMedias();
            setDeleteDialogOpen(false);
            setSocialMediaToDelete(null);
        } catch (error) {
            console.error("Error deleting social media:", error);
            toast.error("خطا در حذف شبکه اجتماعی");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-font-s" />
            </div>
        );
    }

    return (
        <>
            <CardWithIcon
                icon={Share2}
                title="شبکه‌های اجتماعی"
                iconBgColor="bg-orange"
                iconColor="stroke-orange-2"
                borderColor="border-b-orange-1"
                className="hover:shadow-lg transition-all duration-300"
                headerClassName="pb-3"
                titleExtra={
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus />
                            افزودن شبکه اجتماعی
                        </Button>
                }
            >
                    {socialMedias.length === 0 ? (
                        <div className="text-center py-12 text-font-s">
                            شبکه اجتماعی‌ای ثبت نشده است
                        </div>
                    ) : (
                        <div className="rounded-lg border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-bg/50 hover:bg-bg/50">
                                        <TableHead className="w-12 text-right">
                                            <div className="flex items-center justify-center">
                                                <Share2 className="h-4 w-4 text-orange-1" />
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right">نام</TableHead>
                                        <TableHead className="text-right">لینک</TableHead>
                                        <TableHead className="w-24 text-right">آیکون</TableHead>
                                        <TableHead className="w-24 text-right">ترتیب</TableHead>
                                        <TableHead className="w-32 text-right">عملیات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {socialMedias.map((socialMedia) => (
                                        <TableRow key={socialMedia.id} className="hover:bg-bg/50 transition-colors">
                                            <TableCell>
                                                <div className="flex items-center justify-center">
                                                    <div className="p-1.5 bg-orange rounded-lg">
                                                        {socialMedia.icon_data ? (
                                                            <img
                                                                src={socialMedia.icon_data.file_url}
                                                                alt={socialMedia.name}
                                                                className="h-4 w-4 object-cover rounded"
                                                            />
                                                        ) : (
                                                            <Share2 className="h-4 w-4 text-orange-1" />
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="font-medium">{socialMedia.name}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <a
                                                    href={socialMedia.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:underline text-sm truncate block max-w-xs"
                                                >
                                                    {socialMedia.url}
                                                </a>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-md ${
                                                    socialMedia.icon_data 
                                                        ? 'bg-green text-green-2' 
                                                        : 'bg-bg text-font-s'
                                                }`}>
                                                    {socialMedia.icon_data ? 'دارد' : 'ندارد'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-bg rounded-md">
                                                    {socialMedia.order}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 hover:bg-primary hover:text-static-w [&_svg]:hover:stroke-primary-foreground"
                                                        onClick={() => handleOpenDialog(socialMedia)}
                                                    >
                                                        <Edit />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive hover:text-static-w [&_svg]:hover:!stroke-destructive-foreground"
                                                        onClick={() => handleDeleteClick(socialMedia.id)}
                                                    >
                                                        <Trash2 />
                                                    </Button>
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
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingSocialMedia ? "ویرایش شبکه اجتماعی" : "افزودن شبکه اجتماعی"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">نام شبکه اجتماعی *</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="اینستاگرام، تلگرام، لینکدین"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="url">لینک *</Label>
                            <Input
                                id="url"
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://instagram.com/yourpage"
                            />
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

                        <div className="space-y-2">
                            <MediaSelector
                                selectedMedia={icon}
                                onMediaSelect={setIcon}
                                label="آیکون"
                                size="sm"
                            />
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
                                    "ذخیره"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>حذف شبکه اجتماعی</AlertDialogTitle>
                        <AlertDialogDescription>
                            آیا از حذف این شبکه اجتماعی اطمینان دارید؟ این عمل غیرقابل بازگشت است.
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

