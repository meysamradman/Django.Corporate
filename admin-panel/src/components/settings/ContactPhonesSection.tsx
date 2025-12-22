import { useState, useEffect } from "react";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
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
import type { ContactPhone } from "@/types/settings/generalSettings";
import { showError, showSuccess } from "@/core/toast";
import { Plus, Edit, Trash2, Phone, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/elements/Table";
import { DataTableRowActions } from "@/components/tables/DataTableRowActions";
import { Skeleton } from "@/components/elements/Skeleton";

export function ContactPhonesSection() {
    const [phones, setPhones] = useState<ContactPhone[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingPhone, setEditingPhone] = useState<ContactPhone | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [phoneToDelete, setPhoneToDelete] = useState<number | null>(null);
    
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
            showError("خطا در دریافت شماره‌های تماس");
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
            showError("شماره تماس الزامی است");
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
                showSuccess("شماره تماس با موفقیت به‌روزرسانی شد");
            } else {
                await settingsApi.createContactPhone({
                    phone_number: phoneNumber,
                    label: label || undefined,
                    order,
                });
                showSuccess("شماره تماس با موفقیت ایجاد شد");
            }
            
            handleCloseDialog();
            await fetchPhones();
        } catch (error) {
            showError("خطا در ذخیره شماره تماس");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (id: number) => {
        setPhoneToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!phoneToDelete) return;

        try {
            await settingsApi.deleteContactPhone(phoneToDelete);
            showSuccess("شماره تماس با موفقیت حذف شد");
            await fetchPhones();
            setDeleteDialogOpen(false);
            setPhoneToDelete(null);
        } catch (error) {
            showError("خطا در حذف شماره تماس");
        }
    };

    if (loading) {
        return (
            <CardWithIcon
                icon={Phone}
                title="شماره‌های تماس"
                iconBgColor="bg-blue"
                iconColor="stroke-blue-2"
                borderColor="border-b-blue-1"
            >
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                </div>
            </CardWithIcon>
        );
    }

    return (
        <>
            <CardWithIcon
                icon={Phone}
                title="شماره‌های تماس"
                iconBgColor="bg-green"
                iconColor="stroke-green-2"
                borderColor="border-b-green-1"
                className="hover:shadow-lg transition-all duration-300"
                headerClassName="pb-3"
                titleExtra={
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus />
                            افزودن شماره تماس
                        </Button>
                }
            >
                    {phones.length === 0 ? (
                        <div className="text-center py-12 text-font-s">
                            شماره تماسی ثبت نشده است
                        </div>
                    ) : (
                        <div className="rounded-lg border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-bg/50 hover:bg-bg/50">
                                        <TableHead className="text-right">شماره تماس</TableHead>
                                        <TableHead className="text-right">برچسب</TableHead>
                                        <TableHead className="w-24 text-right">ترتیب</TableHead>
                                        <TableHead className="w-[60px] text-center"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {phones.map((phone) => (
                                        <TableRow key={phone.id} className="hover:bg-bg/50 transition-colors">
                                            <TableCell className="text-right">
                                                <span className="font-medium">{phone.phone_number}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="text-font-s">{phone.label || "-"}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-bg rounded-md">
                                                    {phone.order}
                                                </span>
                                            </TableCell>
                                            <TableCell className="w-[60px]">
                                                <div className="flex items-center justify-center">
                                                    <DataTableRowActions
                                                        row={{ original: phone } as any}
                                                        actions={[
                                                            {
                                                                label: "ویرایش",
                                                                icon: <Edit className="h-4 w-4" />,
                                                                onClick: () => handleOpenDialog(phone),
                                                            },
                                                            {
                                                                label: "حذف",
                                                                icon: <Trash2 className="h-4 w-4" />,
                                                                onClick: () => handleDeleteClick(phone.id),
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
                        <AlertDialogTitle>حذف شماره تماس</AlertDialogTitle>
                        <AlertDialogDescription>
                            آیا از حذف این شماره تماس اطمینان دارید؟ این عمل غیرقابل بازگشت است.
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

