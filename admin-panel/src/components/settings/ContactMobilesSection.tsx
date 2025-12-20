import { useState, useEffect } from "react";
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
import { settingsApi } from "@/api/settings/settings";
import type { ContactMobile } from "@/types/settings/generalSettings";
import { toast } from "@/components/elements/Sonner";
import { Plus, Edit, Trash2, Smartphone, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/elements/Table";
import { DataTableRowActions } from "@/components/tables/DataTableRowActions";
import { Skeleton } from "@/components/elements/Skeleton";

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
            toast.error("خطا در حذف شماره موبایل");
        }
    };

    if (loading) {
        return (
            <CardWithIcon
                icon={Smartphone}
                title="شماره‌های موبایل"
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
                                        <TableHead className="text-right">شماره موبایل</TableHead>
                                        <TableHead className="text-right">برچسب</TableHead>
                                        <TableHead className="w-24 text-right">ترتیب</TableHead>
                                        <TableHead className="w-[60px] text-center"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mobiles.map((mobile) => (
                                        <TableRow key={mobile.id} className="hover:bg-bg/50 transition-colors">
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
                                            <TableCell className="w-[60px]">
                                                <div className="flex items-center justify-center">
                                                    <DataTableRowActions
                                                        row={{ original: mobile } as any}
                                                        actions={[
                                                            {
                                                                label: "ویرایش",
                                                                icon: <Edit className="h-4 w-4" />,
                                                                onClick: () => handleOpenDialog(mobile),
                                                            },
                                                            {
                                                                label: "حذف",
                                                                icon: <Trash2 className="h-4 w-4" />,
                                                                onClick: () => handleDeleteClick(mobile.id),
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

