
import { Settings, Plus } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/elements/Table";
import { DataTableRowActions } from "@/components/tables/DataTableRowActions";
import { Key, Edit, Trash2, Loader2 } from "lucide-react";
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

interface RealEstateExtraFieldsProps {
    customAttributes: [string, any][];
    editMode: boolean;
    handleAttributeChange: (key: string, value: any) => void;
    handleOpenDialog: (key?: string) => void;
    handleDeleteClick: (key: string) => void;

    // Dialog props
    dialogOpen: boolean;
    setDialogOpen: (open: boolean) => void;
    editingKey: string | null;
    fieldKey: string;
    setFieldKey: (key: string) => void;
    fieldValue: string;
    setFieldValue: (value: string) => void;
    saving: boolean;
    handleCloseDialog: () => void;
    handleSave: () => void;

    // Alert Dialog props
    deleteDialogOpen: boolean;
    setDeleteDialogOpen: (open: boolean) => void;
    keyToDelete: string | null;
    handleDelete: () => void;
}

export function RealEstateExtraFields({
    customAttributes,
    editMode,
    handleAttributeChange,
    handleOpenDialog,
    handleDeleteClick,

    dialogOpen,
    setDialogOpen,
    editingKey,
    fieldKey,
    setFieldKey,
    fieldValue,
    setFieldValue,
    saving,
    handleCloseDialog,
    handleSave,

    deleteDialogOpen,
    setDeleteDialogOpen,
    keyToDelete,
    handleDelete
}: RealEstateExtraFieldsProps) {
    return (
        <div className="space-y-6">
            {customAttributes.length === 0 ? (
                <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-0 mb-3">
                        <Settings className="h-6 w-6 text-purple-1" />
                    </div>
                    <p className="text-font-m font-medium text-font-p mb-1">فیلد اضافی ثبت نشده است</p>
                    <p className="text-font-s text-font-s/60 mb-4">برای ثبت اطلاعات خاص، فیلد جدید اضافه کنید</p>
                    {editMode && (
                        <Button onClick={() => handleOpenDialog()} variant="outline" size="sm">
                            <Plus className="h-4 w-4 ml-2" />
                            افزودن فیلد
                        </Button>
                    )}
                </div>
            ) : (
                <div className="border border-br overflow-hidden rounded-md bg-wt">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-table-header-bg border-b border-br hover:bg-table-header-bg">
                                <TableHead className="text-right font-bold text-font-p py-4 px-6">نام فیلد</TableHead>
                                <TableHead className="text-right font-bold text-font-p py-4 px-6">مقدار</TableHead>
                                {editMode && <TableHead className="w-[100px] text-center font-bold text-font-p py-4 px-6">عملیات</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {customAttributes.map(([key, value]) => (
                                <TableRow key={key} className="hover:bg-purple-0/30 transition-colors border-b border-br last:border-b-0 group">
                                    <TableCell className="text-right py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="shrink-0 w-8 h-8 rounded-lg bg-purple-0 flex items-center justify-center">
                                                <Key className="h-4 w-4 text-purple-1" />
                                            </div>
                                            <span className="font-semibold text-font-p">{key}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right py-4 px-6">
                                        {editMode ? (
                                            <Input
                                                type="text"
                                                value={value ? String(value) : ""}
                                                onChange={(e) => handleAttributeChange(key, e.target.value)}
                                                placeholder="مقدار را وارد کنید"
                                                className="max-w-md bg-wt h-9 border-br focus:border-purple-1"
                                            />
                                        ) : (
                                            <span className="text-font-p font-medium">
                                                {value ? String(value) : <span className="text-muted-foreground italic">خالی</span>}
                                            </span>
                                        )}
                                    </TableCell>
                                    {editMode && (
                                        <TableCell className="py-4 px-6">
                                            <div className="flex items-center justify-center">
                                                <DataTableRowActions
                                                    row={{ original: { id: key } } as any}
                                                    actions={[
                                                        {
                                                            label: "ویرایش نام",
                                                            icon: <Edit className="h-4 w-4" />,
                                                            onClick: () => handleOpenDialog(key),
                                                        },
                                                        {
                                                            label: "حذف",
                                                            icon: <Trash2 className="h-4 w-4" />,
                                                            onClick: () => handleDeleteClick(key),
                                                            isDestructive: true,
                                                        },
                                                    ]}
                                                />
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {editMode && (
                <>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold text-font-p">
                                    {editingKey ? "ویرایش فیلد اضافی" : "افزودن فیلد اضافی جدید"}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-5 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="field_key" className="text-font-m font-semibold text-font-p">
                                        نام فیلد (شناسه) <span className="text-red-1">*</span>
                                    </Label>
                                    <Input
                                        id="field_key"
                                        value={fieldKey}
                                        onChange={(e) => setFieldKey(e.target.value)}
                                        placeholder="مثال: balcony_size"
                                        className="bg-wt"
                                        disabled={!!editingKey}
                                    />
                                    {editingKey && (
                                        <p className="text-xs text-muted-foreground mt-1">برای تغییر شناسه، فیلد را حذف و مجدداً بسازید.</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="field_value" className="text-font-m font-semibold text-font-p">مقدار فیلد</Label>
                                    <Input
                                        id="field_value"
                                        value={fieldValue}
                                        onChange={(e) => setFieldValue(e.target.value)}
                                        placeholder="مثال: 15 متر"
                                        className="bg-wt"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-6 border-t border-br mt-4">
                                    <Button variant="outline" onClick={handleCloseDialog}>انصراف</Button>
                                    <Button onClick={handleSave} disabled={saving}>
                                        {saving ? (
                                            <><Loader2 className="h-4 w-4 animate-spin ml-2" />در حال ذخیره...</>
                                        ) : "ذخیره فیلد"}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-xl font-bold">تایید حذف فیلد</AlertDialogTitle>
                                <AlertDialogDescription className="text-font-m">
                                    آیا از حذف فیلد <strong>{keyToDelete}</strong> اطمینان دارید؟ این عمل غیرقابل بازگشت است.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-2">
                                <AlertDialogCancel>لغو</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-red-1 hover:bg-red-2 text-white">
                                    بله، حذف شود
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </>
            )}
        </div>
    );
}
