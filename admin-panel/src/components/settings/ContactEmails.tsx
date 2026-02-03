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
import { Plus, Edit, Trash2, Mail } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/elements/Table";
import { DataTableRowActions } from "@/components/tables/DataTableRowActions";
import { Skeleton } from "@/components/elements/Skeleton";
import { useGlobalDrawerStore } from "@/components/shared/drawer/store";
import { DRAWER_IDS } from "@/components/shared/drawer/types";

export function ContactEmails() {
    const queryClient = useQueryClient();
    const openDrawer = useGlobalDrawerStore(state => state.open);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [emailToDelete, setEmailToDelete] = useState<number | null>(null);

    const { data: emails = [], isLoading } = useQuery({
        queryKey: ["contact-emails"],
        queryFn: () => settingsApi.getContactEmails(),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => settingsApi.deleteContactEmail(id),
        onSuccess: () => {
            showSuccess("ایمیل با موفقیت حذف شد");
            queryClient.invalidateQueries({ queryKey: ["contact-emails"] });
            setDeleteDialogOpen(false);
            setEmailToDelete(null);
        },
        onError: () => {
            showError("خطا در حذف ایمیل");
        },
    });

    const handleOpenSide = (id?: number) => {
        openDrawer(DRAWER_IDS.SETTINGS_EMAIL_FORM, { editId: id });
    };

    const handleDeleteClick = (id: number) => {
        setEmailToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDelete = () => {
        if (emailToDelete) {
            deleteMutation.mutate(emailToDelete);
        }
    };

    if (isLoading) {
        return (
            <CardWithIcon
                icon={Mail}
                title="ایمیل‌ها"
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
                icon={Mail}
                title="ایمیل‌ها"
                iconBgColor="bg-purple"
                iconColor="stroke-purple-2"
                borderColor="border-b-purple-1"
                className="hover:shadow-lg transition-all duration-300"
                headerClassName="pb-3"
                titleExtra={
                    <Button onClick={() => handleOpenSide()}>
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
                                {emails.map((email) => (
                                    <TableRow key={email.id} className="hover:bg-bg/50 transition-colors">
                                        <TableCell className="text-right">
                                            <span className="font-medium">{email.email}</span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="text-font-s">{email.label || "-"}</span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-bg rounded-md">
                                                {email.order}
                                            </span>
                                        </TableCell>
                                        <TableCell className="w-[60px]">
                                            <div className="flex items-center justify-center">
                                                <DataTableRowActions
                                                    row={{ original: email } as any}
                                                    actions={[
                                                        {
                                                            label: "ویرایش",
                                                            icon: <Edit className="h-4 w-4" />,
                                                            onClick: () => handleOpenSide(email.id),
                                                        },
                                                        {
                                                            label: "حذف",
                                                            icon: <Trash2 className="h-4 w-4" />,
                                                            onClick: () => handleDeleteClick(email.id),
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
                        <AlertDialogTitle>حذف ایمیل</AlertDialogTitle>
                        <AlertDialogDescription>
                            آیا از حذف این ایمیل اطمینان دارید؟ این عمل غیرقابل بازگشت است.
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
