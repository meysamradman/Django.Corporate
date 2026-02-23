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
import { getCrud } from "@/core/messages/ui";
import { getError } from "@/core/messages/errors";
import { Plus, Edit, Trash2, Share2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/elements/Table";
import { DataTableRowActions } from "@/components/tables/DataTableRowActions";
import { Skeleton } from "@/components/elements/Skeleton";
import { MediaImage } from "@/components/media/base/MediaImage";
import { useGlobalDrawerStore } from "@/components/shared/drawer/store";
import { DRAWER_IDS } from "@/components/shared/drawer/types";

export function SocialMediaSection() {
    const queryClient = useQueryClient();
    const openDrawer = useGlobalDrawerStore(state => state.open);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    const { data: items = [], isLoading } = useQuery({
        queryKey: ["social-medias"],
        queryFn: () => settingsApi.getSocialMedias(),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => settingsApi.deleteSocialMedia(id),
        onSuccess: () => {
            showSuccess(getCrud("deleted", { item: "شبکه اجتماعی" }));
            queryClient.invalidateQueries({ queryKey: ["social-medias"] });
            setDeleteDialogOpen(false);
            setItemToDelete(null);
        },
        onError: (error) => {
            notifyApiError(error, {
                fallbackMessage: getError("serverError"),
                dedupeKey: "settings-social-delete-error",
                preferBackendMessage: false,
            });
        },
    });

    const handleOpenSide = (id?: number) => {
        openDrawer(DRAWER_IDS.SETTINGS_SOCIAL_FORM, { editId: id });
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
                icon={Share2}
                title="شبکه‌های اجتماعی"
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
                icon={Share2}
                title="شبکه‌های اجتماعی"
                iconBgColor="bg-sky"
                iconColor="stroke-sky-2"
                cardBorderColor="border-b-sky-1"
                className="hover:shadow-lg transition-all duration-300"
                headerClassName="pb-3"
                titleExtra={
                    <Button onClick={() => handleOpenSide()}>
                        <Plus />
                        افزودن شبکه اجتماعی
                    </Button>
                }
            >
                {items.length === 0 ? (
                    <div className="text-center py-12 text-font-s">
                        شبکه اجتماعی ثبت نشده است
                    </div>
                ) : (
                    <div className="rounded-lg border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-bg/50 hover:bg-bg/50">
                                    <TableHead className="w-20 text-center">آیکون</TableHead>
                                    <TableHead className="text-right">نام</TableHead>
                                    <TableHead className="text-right">لینک</TableHead>
                                    <TableHead className="w-24 text-right">ترتیب</TableHead>
                                    <TableHead className="w-15 text-center"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-bg/50 transition-colors">
                                        <TableCell className="text-center">
                                            {item.icon_data ? (
                                                <div className="flex justify-center">
                                                    <MediaImage
                                                        media={item.icon_data}
                                                        alt={item.name}
                                                        className="h-8 w-8 object-contain"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="h-8 w-8 mx-auto bg-muted/20 rounded flex items-center justify-center">
                                                    <Share2 className="h-4 w-4 text-font-s" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">{item.name}</TableCell>
                                        <TableCell className="text-right">
                                            <a
                                                href={item.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline text-dir-ltr truncate max-w-50 inline-block"
                                            >
                                                {item.url}
                                            </a>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-bg rounded-md">
                                                {item.order}
                                            </span>
                                        </TableCell>
                                        <TableCell className="w-15">
                                            <div className="flex items-center justify-center">
                                                <DataTableRowActions
                                                    row={{ original: item } as any}
                                                    actions={[
                                                        {
                                                            label: "ویرایش",
                                                            icon: <Edit className="h-4 w-4" />,
                                                            onClick: () => handleOpenSide(item.id),
                                                        },
                                                        {
                                                            label: "حذف",
                                                            icon: <Trash2 className="h-4 w-4" />,
                                                            onClick: () => handleDeleteClick(item.id),
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
                        <AlertDialogTitle>حذف شبکه اجتماعی</AlertDialogTitle>
                        <AlertDialogDescription>
                            آیا از حذف این شبکه اجتماعی اطمینان دارید؟ این عمل غیرقابل بازگشت است.
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
