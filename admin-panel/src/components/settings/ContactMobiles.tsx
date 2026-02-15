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
import { notifyApiError, showSuccess } from "@/core/toast";
import { Plus, Edit, Trash2, Smartphone } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/elements/Table";
import { DataTableRowActions } from "@/components/tables/DataTableRowActions";
import { Skeleton } from "@/components/elements/Skeleton";
import { useGlobalDrawerStore } from "@/components/shared/drawer/store";
import { DRAWER_IDS } from "@/components/shared/drawer/types";

export function ContactMobiles() {
    const queryClient = useQueryClient();
    const openDrawer = useGlobalDrawerStore(state => state.open);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [mobileToDelete, setMobileToDelete] = useState<number | null>(null);

    const { data: mobiles = [], isLoading } = useQuery({
        queryKey: ["contact-mobiles"],
        queryFn: () => settingsApi.getContactMobiles(),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => settingsApi.deleteContactMobile(id),
        onSuccess: () => {
            showSuccess("شماره موبایل با موفقیت حذف شد");
            queryClient.invalidateQueries({ queryKey: ["contact-mobiles"] });
            setDeleteDialogOpen(false);
            setMobileToDelete(null);
        },
        onError: (error) => {
            notifyApiError(error, {
                fallbackMessage: "خطا در حذف شماره موبایل",
                dedupeKey: "settings-contact-mobile-delete-error",
                preferBackendMessage: false,
            });
        },
    });

    const handleOpenSide = (id?: number) => {
        openDrawer(DRAWER_IDS.SETTINGS_MOBILE_FORM, { editId: id });
    };

    const handleDeleteClick = (id: number) => {
        setMobileToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDelete = () => {
        if (mobileToDelete) {
            deleteMutation.mutate(mobileToDelete);
        }
    };

    if (isLoading) {
        return (
            <CardWithIcon
                icon={Smartphone}
                title="شماره‌های موبایل"
                iconBgColor="bg-blue"
                iconColor="stroke-blue-2"
                cardBorderColor="border-b-blue-1"
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
                iconBgColor="bg-amber"
                iconColor="stroke-amber-2"
                cardBorderColor="border-b-amber-1"
                className="hover:shadow-lg transition-all duration-300"
                headerClassName="pb-3"
                titleExtra={
                    <Button onClick={() => handleOpenSide()}>
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
                                            <span className="font-medium text-dir-ltr inline-block">{mobile.mobile_number}</span>
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
                                                            onClick: () => handleOpenSide(mobile.id),
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
