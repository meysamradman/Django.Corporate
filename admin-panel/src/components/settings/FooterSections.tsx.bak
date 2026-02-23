import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Columns3, CheckCircle2, XCircle } from "lucide-react";

import { settingsApi } from "@/api/settings/settings";
import { Button } from "@/components/elements/Button";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Skeleton } from "@/components/elements/Skeleton";
import { Badge } from "@/components/elements/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/elements/Table";
import { DataTableRowActions } from "@/components/tables/DataTableRowActions";
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
import { useGlobalDrawerStore } from "@/components/shared/drawer/store";
import { DRAWER_IDS } from "@/components/shared/drawer/types";
import { notifyApiError, showSuccess } from "@/core/toast";
import { getCrud } from "@/core/messages/ui";
import { getError } from "@/core/messages/errors";

export function FooterSections() {
    const queryClient = useQueryClient();
    const openDrawer = useGlobalDrawerStore(state => state.open);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    const { data: sections = [], isLoading } = useQuery({
        queryKey: ["footer-sections"],
        queryFn: () => settingsApi.getFooterSections(),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => settingsApi.deleteFooterSection(id),
        onSuccess: () => {
            showSuccess(getCrud("deleted", { item: "ستون فوتر" }));
            queryClient.invalidateQueries({ queryKey: ["footer-sections"] });
            queryClient.invalidateQueries({ queryKey: ["footer-links"] });
            setDeleteDialogOpen(false);
            setItemToDelete(null);
        },
        onError: (error) => {
            notifyApiError(error, {
                fallbackMessage: getError("serverError"),
                dedupeKey: "settings-footer-section-delete-error",
                preferBackendMessage: false,
            });
        },
    });

    const handleOpenSide = (id?: number) => {
        openDrawer(DRAWER_IDS.SETTINGS_FOOTER_SECTION_FORM, { editId: id });
    };

    const handleDeleteClick = (id: number) => {
        setItemToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDelete = () => {
        if (itemToDelete) {
            deleteMutation.mutate(itemToDelete);
        }
    };

    if (isLoading) {
        return (
            <CardWithIcon
                icon={Columns3}
                title="ستون‌های فوتر"
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
                icon={Columns3}
                title="ستون‌های فوتر"
                iconBgColor="bg-indigo"
                iconColor="stroke-indigo-2"
                cardBorderColor="border-b-indigo-1"
                className="hover:shadow-lg transition-all duration-300"
                headerClassName="pb-3"
                titleExtra={
                    <Button onClick={() => handleOpenSide()}>
                        <Plus />
                        افزودن ستون
                    </Button>
                }
            >
                {sections.length === 0 ? (
                    <div className="text-center py-12 text-font-s">
                        ستونی برای فوتر ثبت نشده است
                    </div>
                ) : (
                    <div className="rounded-lg border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-bg/50 hover:bg-bg/50">
                                    <TableHead className="text-right">عنوان</TableHead>
                                    <TableHead className="w-24 text-center">وضعیت</TableHead>
                                    <TableHead className="w-24 text-center">ترتیب</TableHead>
                                    <TableHead className="w-15 text-center"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sections
                                    .slice()
                                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                                    .map((section) => (
                                        <TableRow key={section.id} className="hover:bg-bg/50 transition-colors">
                                            <TableCell className="text-right font-medium">
                                                {section.title}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {section.is_active ? (
                                                    <Badge variant="outline" className="border-green-1 text-green-1 gap-1">
                                                        <CheckCircle2 className="h-3 w-3" /> فعال
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="border-red-1 text-red-1 gap-1">
                                                        <XCircle className="h-3 w-3" /> غیرفعال
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-semibold bg-bg border rounded-full text-font-p shadow-sm min-w-8">
                                                    {section.order}
                                                </span>
                                            </TableCell>
                                            <TableCell className="w-15">
                                                <div className="flex items-center justify-center">
                                                    <DataTableRowActions
                                                        row={{ original: section } as any}
                                                        actions={[
                                                            {
                                                                label: "ویرایش",
                                                                icon: <Edit className="h-4 w-4" />,
                                                                onClick: () => handleOpenSide(section.id),
                                                            },
                                                            {
                                                                label: "حذف",
                                                                icon: <Trash2 className="h-4 w-4" />,
                                                                onClick: () => handleDeleteClick(section.id),
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
                        <AlertDialogTitle>حذف ستون فوتر</AlertDialogTitle>
                        <AlertDialogDescription>
                            آیا از حذف این ستون اطمینان دارید؟ این عمل غیرقابل بازگشت است.
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
