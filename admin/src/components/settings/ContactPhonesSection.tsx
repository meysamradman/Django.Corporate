"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/elements/Dialog";
import { settingsApi, ContactPhone } from "@/api/settings/general/route";
import { toast } from "@/components/elements/Sonner";
import { Plus, Edit, Trash2, Phone, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/elements/Table";

export function ContactPhonesSection() {
    const [phones, setPhones] = useState<ContactPhone[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingPhone, setEditingPhone] = useState<ContactPhone | null>(null);
    
    const [phoneNumber, setPhoneNumber] = useState("");
    const [label, setLabel] = useState("");
    const [order, setOrder] = useState(0);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPhones();
    }, []);

    const fetchPhones = async () => {
        try {
            setLoading(true);
            const data = await settingsApi.getContactPhones();
            setPhones(data);
        } catch (error) {
            console.error("Error fetching phones:", error);
            toast.error("خطا در دریافت شماره‌های تماس");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (phone?: ContactPhone) => {
        if (phone) {
            setEditingPhone(phone);
            setPhoneNumber(phone.phone_number);
            setLabel(phone.label);
            setOrder(phone.order);
        } else {
            setEditingPhone(null);
            setPhoneNumber("");
            setLabel("");
            setOrder(0);
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingPhone(null);
        setPhoneNumber("");
        setLabel("");
        setOrder(0);
    };

    const handleSave = async () => {
        if (!phoneNumber.trim()) {
            toast.error("شماره تماس الزامی است");
            return;
        }

        try {
            setSaving(true);
            
            if (editingPhone) {
                await settingsApi.updateContactPhone(editingPhone.id, {
                    phone_number: phoneNumber,
                    label: label || undefined,
                    order,
                });
                toast.success("شماره تماس با موفقیت به‌روزرسانی شد");
            } else {
                await settingsApi.createContactPhone({
                    phone_number: phoneNumber,
                    label: label || undefined,
                    order,
                });
                toast.success("شماره تماس با موفقیت ایجاد شد");
            }
            
            handleCloseDialog();
            await fetchPhones();
        } catch (error) {
            console.error("Error saving phone:", error);
            toast.error("خطا در ذخیره شماره تماس");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("آیا از حذف این شماره تماس اطمینان دارید؟")) {
            return;
        }

        try {
            await settingsApi.deleteContactPhone(id);
            toast.success("شماره تماس با موفقیت حذف شد");
            await fetchPhones();
        } catch (error) {
            console.error("Error deleting phone:", error);
            toast.error("خطا در حذف شماره تماس");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <>
            <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-green-500">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-green-100 rounded-xl shadow-sm">
                                <Phone className="w-5 h-5 stroke-green-600" />
                            </div>
                            <CardTitle>شماره‌های تماس</CardTitle>
                        </div>
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus className="mr-2 h-4 w-4" />
                            افزودن شماره تماس
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {phones.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            شماره تماسی ثبت نشده است
                        </div>
                    ) : (
                        <div className="rounded-lg border border-border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                                        <TableHead className="w-12">
                                            <div className="flex items-center justify-center">
                                                <Phone className="h-4 w-4 text-green-600" />
                                            </div>
                                        </TableHead>
                                        <TableHead>شماره تماس</TableHead>
                                        <TableHead>برچسب</TableHead>
                                        <TableHead className="w-24">ترتیب</TableHead>
                                        <TableHead className="w-32 text-center">عملیات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {phones.map((phone) => (
                                        <TableRow key={phone.id} className="hover:bg-accent/50 transition-colors">
                                            <TableCell>
                                                <div className="flex items-center justify-center">
                                                    <div className="p-1.5 bg-green-100 rounded-lg">
                                                        <Phone className="h-4 w-4 text-green-600" />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium">{phone.phone_number}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-muted-foreground">{phone.label || "-"}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-muted rounded-md">
                                                    {phone.order}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 hover:bg-primary hover:text-primary-foreground"
                                                        onClick={() => handleOpenDialog(phone)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                                        onClick={() => handleDelete(phone.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingPhone ? "ویرایش شماره تماس" : "افزودن شماره تماس"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone_number">شماره تماس *</Label>
                            <Input
                                id="phone_number"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="021-12345678"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="label">برچسب</Label>
                            <Input
                                id="label"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                placeholder="دفتر مرکزی، پشتیبانی"
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
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
        </>
    );
}

