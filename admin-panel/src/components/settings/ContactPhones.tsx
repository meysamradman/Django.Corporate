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
import { settingsApi } from "@/api/settings/settings";
import { showError, showSuccess } from "@/core/toast";
import { Plus, Edit, Trash2, Phone } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/elements/Table";
import { DataTableRowActions } from "@/components/tables/DataTableRowActions";
import { Skeleton } from "@/components/elements/Skeleton";
import { useSearchParams } from "react-router-dom";

export function ContactPhones() {
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [phoneToDelete, setPhoneToDelete] = useState<number | null>(null);

    const { data: phones = [], isLoading } = useQuery({
        queryKey: ["contact-phones"],
        queryFn: () => settingsApi.getContactPhones(),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => settingsApi.deleteContactPhone(id),
        onSuccess: () => {
            showSuccess("شماره تماس با موفقیت حذف شد");
            queryClient.invalidateQueries({ queryKey: ["contact-phones"] });
            setDeleteDialogOpen(false);
            setPhoneToDelete(null);
        },
        onError: () => {
            showError("خطا در حذف شماره تماس");
        },
    });

    const handleOpenSide = (id?: number) => {
        const newParams = new URLSearchParams(searchParams);
        if (id) {
            newParams.set("action", "edit-phone");
            newParams.set("id", id.toString());
        } else {
            newParams.set("action", "create-phone");
        }
        setSearchParams(newParams);
    };

    const handleDeleteClick = (id: number) => {
        setPhoneToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDelete = () => {
        if (phoneToDelete) {
            deleteMutation.mutate(phoneToDelete);
        }
    };

    if (isLoading) {
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
                    <Button onClick={() => handleOpenSide()}>
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
                                            <span className="font-medium text-dir-ltr inline-block">{phone.phone_number}</span>
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
                                                            onClick: () => handleOpenSide(phone.id),
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
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                            className="bg-red-1 hover:bg-red-2 text-white"
                        >
                            حذف
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

