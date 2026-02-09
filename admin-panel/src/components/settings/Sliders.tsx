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
import { Plus, Edit, Trash2, Layout, ExternalLink, CheckCircle2, XCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/elements/Table";
import { DataTableRowActions } from "@/components/tables/DataTableRowActions";
import { Skeleton } from "@/components/elements/Skeleton";
import { MediaImage } from "@/components/media/base/MediaImage";
import { Badge } from "@/components/elements/Badge";
import { useGlobalDrawerStore } from "@/components/shared/drawer/store";
import { DRAWER_IDS } from "@/components/shared/drawer/types";

export function Sliders() {
    const queryClient = useQueryClient();
    const openDrawer = useGlobalDrawerStore(state => state.open);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    const { data: sliders = [], isLoading } = useQuery({
        queryKey: ["sliders"],
        queryFn: () => settingsApi.getSliders(),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => settingsApi.deleteSlider(id),
        onSuccess: () => {
            showSuccess("اسلایدر با موفقیت حذف شد");
            queryClient.invalidateQueries({ queryKey: ["sliders"] });
            setDeleteDialogOpen(false);
            setItemToDelete(null);
        },
        onError: () => {
            showError("خطا در حذف اسلایدر");
        },
    });

    const handleOpenSide = (id?: number) => {
        openDrawer(DRAWER_IDS.SETTINGS_SLIDER_FORM, { editId: id });
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
                icon={Layout}
                title="اسلایدرها"
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
                icon={Layout}
                title="اسلایدرها"
                iconBgColor="bg-indigo"
                iconColor="stroke-indigo-2"
                cardBorderColor="border-b-indigo-1"
                className="hover:shadow-lg transition-all duration-300"
                headerClassName="pb-3"
                titleExtra={
                    <Button onClick={() => handleOpenSide()}>
                        <Plus />
                        افزودن اسلایدر
                    </Button>
                }
            >
                {sliders.length === 0 ? (
                    <div className="text-center py-12 text-font-s">
                        اسلایدری ثبت نشده است
                    </div>
                ) : (
                    <div className="rounded-lg border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-bg/50 hover:bg-bg/50">
                                    <TableHead className="w-[120px] text-center">تصویر</TableHead>
                                    <TableHead className="text-right">عنوان</TableHead>
                                    <TableHead className="text-right">لینک</TableHead>
                                    <TableHead className="w-24 text-center">وضعیت</TableHead>
                                    <TableHead className="w-24 text-center">ترتیب</TableHead>
                                    <TableHead className="w-[60px] text-center"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sliders.map((slider) => (
                                    <TableRow key={slider.id} className="hover:bg-bg/50 transition-colors">
                                        <TableCell className="text-center">
                                            {slider.image_data ? (
                                                <div className="flex justify-center p-1">
                                                    <MediaImage
                                                        media={slider.image_data as any}
                                                        alt={slider.title}
                                                        className="h-16 w-24 object-cover rounded shadow-sm border border-muted/10"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="h-16 w-24 mx-auto bg-muted/20 rounded flex items-center justify-center">
                                                    <Layout className="h-6 w-6 text-font-s opacity-20" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            <div className="flex flex-col gap-1">
                                                <span>{slider.title}</span>
                                                {slider.description && (
                                                    <span className="text-xs text-font-s font-normal truncate max-w-[200px]">
                                                        {slider.description}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {slider.link ? (
                                                <a
                                                    href={slider.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-xs font-medium transition-colors"
                                                >
                                                    مشاهده لینک <ExternalLink className="h-3 w-3" />
                                                </a>
                                            ) : (
                                                <span className="text-xs text-font-s">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {slider.is_active ? (
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
                                            <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-semibold bg-bg border rounded-full text-font-p shadow-sm min-w-[32px]">
                                                {slider.order}
                                            </span>
                                        </TableCell>
                                        <TableCell className="w-[60px]">
                                            <div className="flex items-center justify-center">
                                                <DataTableRowActions
                                                    row={{ original: slider } as any}
                                                    actions={[
                                                        {
                                                            label: "ویرایش",
                                                            icon: <Edit className="h-4 w-4" />,
                                                            onClick: () => handleOpenSide(slider.id),
                                                        },
                                                        {
                                                            label: "حذف",
                                                            icon: <Trash2 className="h-4 w-4" />,
                                                            onClick: () => handleDeleteClick(slider.id),
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
                        <AlertDialogTitle>حذف اسلایدر</AlertDialogTitle>
                        <AlertDialogDescription>
                            آیا از حذف این اسلایدر اطمینان دارید؟ این عمل غیرقابل بازگشت است.
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
