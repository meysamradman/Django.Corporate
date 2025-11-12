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
import { settingsApi, ContactMobile } from "@/api/settings/general/route";
import { toast } from "@/components/elements/Sonner";
import { Plus, Edit, Trash2, Smartphone, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/elements/Table";

export function ContactMobilesSection() {
    const [mobiles, setMobiles] = useState<ContactMobile[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingMobile, setEditingMobile] = useState<ContactMobile | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [mobileToDelete, setMobileToDelete] = useState<number | null>(null);
    
    const [mobileNumber, setMobileNumber] = useState("");
    const [label, setLabel] = useState("");
    const [order, setOrder] = useState(0);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchMobiles();
    }, []);

    const fetchMobiles = async () => {
        try {
            setLoading(true);
            const data = await settingsApi.getContactMobiles();
            setMobiles(data);
        } catch (error) {
            console.error("Error fetching mobiles:", error);
            toast.error("خطا در دریافت شماره‌های موبایل");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (mobile?: ContactMobile) => {
        if (mobile) {
            setEditingMobile(mobile);
            setMobileNumber(mobile.mobile_number);
            setLabel(mobile.label);
            setOrder(mobile.order);
        } else {
            setEditingMobile(null);
            setMobileNumber("");
            setLabel("");
            setOrder(0);
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingMobile(null);
        setMobileNumber("");
        setLabel("");
        setOrder(0);
    };

    const handleSave = async () => {
        if (!mobileNumber.trim()) {
            toast.error("شماره موبایل الزامی است");
            return;
        }

        try {
            setSaving(true);
            
            if (editingMobile) {
                await settingsApi.updateContactMobile(editingMobile.id, {
                    mobile_number: mobileNumber,
                    label: label || undefined,
                    order,
                });
                toast.success("شماره موبایل با موفقیت به‌روزرسانی شد");
            } else {
                await settingsApi.createContactMobile({
                    mobile_number: mobileNumber,
                    label: label || undefined,
                    order,
                });
                toast.success("شماره موبایل با موفقیت ایجاد شد");
            }
            
            handleCloseDialog();
            await fetchMobiles();
        } catch (error) {
            console.error("Error saving mobile:", error);
            toast.error("خطا در ذخیره شماره موبایل");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (id: number) => {
        setMobileToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!mobileToDelete) return;

        try {
            await settingsApi.deleteContactMobile(mobileToDelete);
            toast.success("شماره موبایل با موفقیت حذف شد");
            await fetchMobiles();
            setDeleteDialogOpen(false);
            setMobileToDelete(null);
        } catch (error) {
            console.error("Error deleting mobile:", error);
            toast.error("خطا در حذف شماره موبایل");
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
                icon={Smartphone}
                title="شماره‌های موبایل"
                iconBgColor="bg-blue"
                iconColor="stroke-blue-2"
                borderColor="border-b-blue-1"
                className="hover:shadow-lg transition-all duration-300"
                headerClassName="pb-3"
                titleExtra={
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus />
                            افزودن شماره موبایل
                        </Button>
                }
            >
                    {mobiles.length === 0 ? (
                        <div className="text-center py-12 text-font-s">
                            شماره موبایلی ثبت نشده است
                        </div>
                    ) : (
                        <div className="rounded-lg border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-bg/50 hover:bg-bg/50">
                                        <TableHead className="w-12 text-right">
                                            <div className="flex items-center justify-center">
                                                <Smartphone className="h-4 w-4 text-cyan-600" />
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right">شماره موبایل</TableHead>
                                        <TableHead className="text-right">برچسب</TableHead>
                                        <TableHead className="w-24 text-right">ترتیب</TableHead>
                                        <TableHead className="w-32 text-right">عملیات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mobiles.map((mobile) => (
                                        <TableRow key={mobile.id} className="hover:bg-bg/50 transition-colors">
                                            <TableCell>
                                                <div className="flex items-center justify-center">
                                                    <div className="p-1.5 bg-cyan-100 rounded-lg">
                                                        <Smartphone className="h-4 w-4 text-cyan-600" />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="font-medium">{mobile.mobile_number}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="text-font-s">{mobile.label || "-"}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-bg rounded-md">
                                                    {mobile.order}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 hover:bg-primary hover:text-static-w [&_svg]:hover:stroke-primary-foreground"
                                                        onClick={() => handleOpenDialog(mobile)}
                                                    >
                                                        <Edit />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive hover:text-static-w [&_svg]:hover:!stroke-destructive-foreground"
                                                        onClick={() => handleDeleteClick(mobile.id)}
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingMobile ? "ویرایش شماره موبایل" : "افزودن شماره موبایل"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="mobile_number">شماره موبایل *</Label>
                            <Input
                                id="mobile_number"
                                value={mobileNumber}
                                onChange={(e) => setMobileNumber(e.target.value)}
                                placeholder="09123456789"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="label">برچسب</Label>
                            <Input
                                id="label"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                placeholder="پشتیبانی، فروش"
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
                        <AlertDialogTitle>حذف شماره موبایل</AlertDialogTitle>
                        <AlertDialogDescription>
                            آیا از حذف این شماره موبایل اطمینان دارید؟ این عمل غیرقابل بازگشت است.
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

