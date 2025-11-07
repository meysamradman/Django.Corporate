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
import { settingsApi, ContactEmail } from "@/api/settings/general/route";
import { toast } from "@/components/elements/Sonner";
import { Plus, Edit, Trash2, Mail, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/elements/Table";

export function ContactEmailsSection() {
    const [emails, setEmails] = useState<ContactEmail[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingEmail, setEditingEmail] = useState<ContactEmail | null>(null);
    
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
            console.error("Error fetching emails:", error);
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
            console.error("Error saving email:", error);
            toast.error("خطا در ذخیره ایمیل");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("آیا از حذف این ایمیل اطمینان دارید؟")) {
            return;
        }

        try {
            await settingsApi.deleteContactEmail(id);
            toast.success("ایمیل با موفقیت حذف شد");
            await fetchEmails();
        } catch (error) {
            console.error("Error deleting email:", error);
            toast.error("خطا در حذف ایمیل");
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
            <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-pink-500">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-pink-100 rounded-xl shadow-sm">
                                <Mail className="w-5 h-5 stroke-pink-600" />
                            </div>
                            <CardTitle>ایمیل‌های تماس</CardTitle>
                        </div>
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus className="mr-2 h-4 w-4" />
                            افزودن ایمیل
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {emails.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            ایمیلی ثبت نشده است
                        </div>
                    ) : (
                        <div className="rounded-lg border border-border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                                        <TableHead className="w-12">
                                            <div className="flex items-center justify-center">
                                                <Mail className="h-4 w-4 text-pink-600" />
                                            </div>
                                        </TableHead>
                                        <TableHead>ایمیل</TableHead>
                                        <TableHead>برچسب</TableHead>
                                        <TableHead className="w-24">ترتیب</TableHead>
                                        <TableHead className="w-32 text-center">عملیات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {emails.map((contactEmail) => (
                                        <TableRow key={contactEmail.id} className="hover:bg-accent/50 transition-colors">
                                            <TableCell>
                                                <div className="flex items-center justify-center">
                                                    <div className="p-1.5 bg-pink-100 rounded-lg">
                                                        <Mail className="h-4 w-4 text-pink-600" />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium">{contactEmail.email}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-muted-foreground">{contactEmail.label || "-"}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-muted rounded-md">
                                                    {contactEmail.order}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 hover:bg-primary hover:text-primary-foreground"
                                                        onClick={() => handleOpenDialog(contactEmail)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                                        onClick={() => handleDelete(contactEmail.id)}
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

