import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/elements/Button";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/elements/DropdownMenu";
import { formApi } from "@/api/form-builder/form-builder";
import type { ContactFormField } from "@/types/form/contactForm";
import { showSuccess, showError } from "@/core/toast";
import { Plus, Edit, Trash2, FileText, Globe, Smartphone, MoreVertical, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/elements/Table";
import { Badge } from "@/components/elements/Badge";
import { Skeleton } from "@/components/elements/Skeleton";
import { useGlobalDrawerStore } from "@/components/shared/drawer/store";
import { DRAWER_IDS } from "@/components/shared/drawer/types";

export function FormFieldsSection() {
    const queryClient = useQueryClient();
    const openDrawer = useGlobalDrawerStore(state => state.open);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [fieldToDelete, setFieldToDelete] = useState<number | null>(null);

    const { data: fieldsResponse, isLoading } = useQuery({
        queryKey: ["form-fields"],
        queryFn: () => formApi.getFields(),
    });

    const fields = Array.isArray(fieldsResponse) ? fieldsResponse : [];

    const deleteMutation = useMutation({
        mutationFn: (id: number) => formApi.deleteField(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["form-fields"] });
            showSuccess("فیلد با موفقیت حذف شد");
            setDeleteDialogOpen(false);
            setFieldToDelete(null);
        },
        onError: () => {
            showError("خطایی در حذف فیلد رخ داد");
        },
    });

    const handleOpenSide = (id?: number) => {
        openDrawer(DRAWER_IDS.FORM_BUILDER_FIELD_FORM, {
            editId: id,
            onSuccess: () => queryClient.invalidateQueries({ queryKey: ["form-fields"] })
        });
    };

    const handleDeleteClick = (id: number) => {
        setFieldToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (fieldToDelete) {
            deleteMutation.mutate(fieldToDelete);
        }
    };

    const getFieldTypeLabel = (type: ContactFormField['field_type']) => {
        const labels: Record<ContactFormField['field_type'], string> = {
            text: 'متن',
            email: 'ایمیل',
            phone: 'شماره تلفن',
            textarea: 'متن چندخطی',
            select: 'انتخابی',
            checkbox: 'چک باکس',
            radio: 'رادیو',
            number: 'عدد',
            date: 'تاریخ',
            url: 'لینک',
        };
        return labels[type] || type;
    };

    if (isLoading) {
        return (
            <CardWithIcon
                icon={FileText}
                title="فیلدهای فرم تماس"
                iconBgColor="bg-blue"
                iconColor="stroke-blue-2"
                borderColor="border-b-blue-1"
            >
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </CardWithIcon>
        );
    }

    return (
        <>
            <CardWithIcon
                icon={FileText}
                title="فیلدهای فرم تماس"
                iconBgColor="bg-blue"
                iconColor="stroke-blue-2"
                borderColor="border-b-blue-1"
                className="hover:shadow-lg transition-all duration-300"
                headerClassName="pb-3"
                titleExtra={
                    <Button onClick={() => handleOpenSide()}>
                        <Plus className="h-4 w-4" />
                        افزودن فیلد
                    </Button>
                }
            >
                {fields.length === 0 ? (
                    <div className="text-center py-12 text-font-s">
                        فیلدی ثبت نشده است
                    </div>
                ) : (
                    <div className="rounded-2xl border border-br overflow-hidden bg-card shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-bg/40 hover:bg-bg/40">
                                    <TableHead className="text-right py-4 px-6 text-xs font-bold uppercase tracking-wider text-font-s">کلید فیلد</TableHead>
                                    <TableHead className="text-right py-4 px-6 text-xs font-bold uppercase tracking-wider text-font-s">برچسب</TableHead>
                                    <TableHead className="text-right py-4 px-6 text-xs font-bold uppercase tracking-wider text-font-s">نوع</TableHead>
                                    <TableHead className="text-right py-4 px-6 text-xs font-bold uppercase tracking-wider text-font-s">پلتفرم</TableHead>
                                    <TableHead className="w-24 text-right py-4 px-6 text-xs font-bold uppercase tracking-wider text-font-s">ترتیب</TableHead>
                                    <TableHead className="w-[60px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fields.map((field) => (
                                    <TableRow key={field.id} className="hover:bg-bg/20 transition-colors border-br/40">
                                        <TableCell className="py-4 px-6">
                                            <span className="font-medium font-mono text-sm text-primary">{field.field_key}</span>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-font-p">{field.label}</span>
                                                {field.required && (
                                                    <Badge variant="red" className="text-[10px] h-5 px-2 font-bold uppercase">الزامی</Badge>
                                                )}
                                                {!field.is_active && (
                                                    <Badge variant="outline" className="text-[10px] h-5 px-2 font-bold uppercase">غیرفعال</Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <Badge variant="outline" className="bg-bg/30 border-br font-medium">{getFieldTypeLabel(field.field_type)}</Badge>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="flex gap-1.5">
                                                {field.platforms.includes('website') && (
                                                    <Badge variant="blue" className="text-[10px] font-bold h-6 flex items-center gap-1 shadow-sm">
                                                        <Globe className="h-3 w-3" />
                                                        وب
                                                    </Badge>
                                                )}
                                                {field.platforms.includes('mobile_app') && (
                                                    <Badge variant="green" className="text-[10px] font-bold h-6 flex items-center gap-1 shadow-sm">
                                                        <Smartphone className="h-3 w-3" />
                                                        اپ
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <span className="inline-flex items-center justify-center h-7 w-7 text-xs font-bold bg-muted/20 text-font-s rounded-lg border border-br/20">
                                                {field.order}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="flex items-center justify-center">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8 hover:bg-bg rounded-lg transition-colors"
                                                        >
                                                            <MoreVertical className="h-4 w-4 text-font-s" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start" className="w-[160px] p-1.5 rounded-xl border-br shadow-xl">
                                                        <DropdownMenuItem
                                                            onClick={() => handleOpenSide(field.id)}
                                                            className="flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer"
                                                        >
                                                            <Edit className="h-4 w-4 text-primary" />
                                                            <span className="text-sm font-medium">ویرایش</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteClick(field.id)}
                                                            variant="destructive"
                                                            className="flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer mt-0.5"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            <span className="text-sm font-medium">حذف</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardWithIcon>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl border-br">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-right">حذف فیلد فرم</AlertDialogTitle>
                        <AlertDialogDescription className="text-right text-font-s">
                            آیا از حذف این فیلد اطمینان دارید؟ این عمل غیرقابل بازگشت است و ممکن است باعث از دست رفتن داده‌های مرتبط در فرم‌های ارسال شده شود.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row-reverse gap-3">
                        <AlertDialogCancel className="rounded-xl border-br hover:bg-bg mt-0">انصراف</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "حذف فیلد"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
