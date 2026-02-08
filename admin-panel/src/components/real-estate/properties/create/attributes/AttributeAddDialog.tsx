import { Button } from "@/components/elements/Button";
import { Label } from "@/components/elements/Label";
import { Input } from "@/components/elements/Input";
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
import { Loader2 } from "lucide-react";

interface AttributeAddDialogProps {
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
    deleteDialogOpen: boolean;
    setDeleteDialogOpen: (open: boolean) => void;
    keyToDelete: string | null;
    handleDelete: () => void;
}

export function AttributeAddDialog({
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
}: AttributeAddDialogProps) {
    return (
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
    );
}
