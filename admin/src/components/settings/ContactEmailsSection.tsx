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
import { settingsApi } from "@/api/settings/general/route";
import { ContactEmail } from "@/types/settings/generalSettings";
import { toast } from "@/components/elements/Sonner";
import { Plus, Edit, Trash2, Mail, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/elements/Table";
import { DataTableRowActions } from "@/components/tables/DataTableRowActions";

export function ContactEmailsSection() {
    const [emails, setEmails] = useState<ContactEmail[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingEmail, setEditingEmail] = useState<ContactEmail | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [emailToDelete, setEmailToDelete] = useState<number | null>(null);
    
    const [email, setEmail] = useState("");
    const [label, setLabel] = useState("");
    const [order, setOrder] = useState(0);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchEmails();
    }, []);

    const fetchEmails = async () => {
        try {
            setLoading(true);
            const data = await settingsApi.getContactEmails();
            setEmails(data);
        } catch (error) {
            toast.error("خطا در دریافت ایمیل‌ها");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (contactEmail?: ContactEmail) => {
        if (contactEmail) {
            setEditingEmail(contactEmail);
            setEmail(contactEmail.email);
            setLabel(contactEmail.label);
            setOrder(contactEmail.order);
        } else {
            setEditingEmail(null);
            setEmail("");
            setLabel("");
            setOrder(0);
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingEmail(null);
        setEmail("");
        setLabel("");
        setOrder(0);
    };

    const handleSave = async () => {
        if (!email.trim()) {
            toast.error("ایمیل الزامی است");
            return;
        }

        try {
            setSaving(true);
            
            if (editingEmail) {
                await settingsApi.updateContactEmail(editingEmail.id, {
                    email: email,
                    label: label || undefined,
                    order,
                });
                toast.success("ایمیل با موفقیت به‌روزرسانی شد");
            } else {
                await settingsApi.createContactEmail({
                    email: email,
                    label: label || undefined,
                    order,
                });
                toast.success("ایمیل با موفقیت ایجاد شد");
            }
            
            handleCloseDialog();
            await fetchEmails();
        } catch (error) {
            toast.error("خطا در ذخیره ایمیل");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (id: number) => {
        setEmailToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!emailToDelete) return;

        try {
            await settingsApi.deleteContactEmail(emailToDelete);
            toast.success("ایمیل با موفقیت حذف شد");
            await fetchEmails();
            setDeleteDialogOpen(false);
            setEmailToDelete(null);
        } catch (error) {
            toast.error("خطا در حذف ایمیل");
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
                icon={Mail}
                title="ایمیل‌های تماس"
                iconBgColor="bg-pink"
                iconColor="stroke-pink-2"
                borderColor="border-b-pink-1"
                className="hover:shadow-lg transition-all duration-300"
                headerClassName="pb-3"
                titleExtra={
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus />
                            افزودن ایمیل
                        </Button>
                }
            >
                    {emails.length === 0 ? (
                        <div className="text-center py-12 text-font-s">
                            ایمیلی ثبت نشده است
                        </div>
                    ) : (
                        <div className="rounded-lg border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-bg/50 hover:bg-bg/50">
                                        <TableHead className="text-right">ایمیل</TableHead>
                                        <TableHead className="text-right">برچسب</TableHead>
                                        <TableHead className="w-24 text-right">ترتیب</TableHead>
                                        <TableHead className="w-[60px] text-center"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {emails.map((contactEmail) => (
                                        <TableRow key={contactEmail.id} className="hover:bg-bg/50 transition-colors">
                                            <TableCell className="text-right">
                                                <span className="font-medium">{contactEmail.email}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="text-font-s">{contactEmail.label || "-"}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-bg rounded-md">
                                                    {contactEmail.order}
                                                </span>
                                            </TableCell>
                                            <TableCell className="w-[60px]">
                                                <div className="flex items-center justify-center">
                                                    <DataTableRowActions
                                                        row={{ original: contactEmail } as any}
                                                        actions={[
                                                            {
                                                                label: "ویرایش",
                                                                icon: <Edit className="h-4 w-4" />,
                                                                onClick: () => handleOpenDialog(contactEmail),
                                                            },
                                                            {
                                                                label: "حذف",
                                                                icon: <Trash2 className="h-4 w-4" />,
                                                                onClick: () => handleDeleteClick(contactEmail.id),
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingEmail ? "ویرایش ایمیل" : "افزودن ایمیل"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">ایمیل *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="info@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="label">برچسب</Label>
                            <Input
                                id="label"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                placeholder="پشتیبانی، فروش، اطلاعات"
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
                        <AlertDialogTitle>حذف ایمیل</AlertDialogTitle>
                        <AlertDialogDescription>
                            آیا از حذف این ایمیل اطمینان دارید؟ این عمل غیرقابل بازگشت است.
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

