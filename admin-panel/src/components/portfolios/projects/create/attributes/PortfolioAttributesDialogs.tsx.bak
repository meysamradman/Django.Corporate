import { Label } from "@/components/elements/Label";
import { Input } from "@/components/elements/Input";
import { Button } from "@/components/elements/Button";
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

interface PortfolioAttributesDialogsProps {
    dialogOpen: boolean;
    setDialogOpen: (open: boolean) => void;
    editingKey: string | null;
    fieldKey: string;
    setFieldKey: (val: string) => void;
    fieldValue: string;
    setFieldValue: (val: string) => void;
    saving: boolean;
    handleSave: () => void;
    handleCloseDialog: () => void;
    deleteDialogOpen: boolean;
    setDeleteDialogOpen: (open: boolean) => void;
    handleDelete: () => void;
}

export function PortfolioAttributesDialogs({
    dialogOpen,
    setDialogOpen,
    editingKey,
    fieldKey,
    setFieldKey,
    fieldValue,
    setFieldValue,
    saving,
    handleSave,
    handleCloseDialog,
    deleteDialogOpen,
    setDeleteDialogOpen,
    handleDelete
}: PortfolioAttributesDialogsProps) {
    return (
        <>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold">
                            {editingKey ? "ویرایش فیلد" : "افزودن فیلد جدید"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-5 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="field_key" className="text-font-m font-medium">
                                نام فیلد (انگلیسی) <span className="text-red-1">*</span>
                            </Label>
                            <Input
                                id="field_key"
                                value={fieldKey}
                                onChange={(e) => setFieldKey(e.target.value)}
                                placeholder="مثال: price"
                                className="bg-white"
                                disabled={!!editingKey}
                            />
                            {editingKey && (
                                <p className="text-xs text-font-s">برای تغییر نام فیلد، ابتدا آن را حذف و دوباره اضافه کنید</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="field_value" className="text-font-m font-medium">
                                مقدار
                            </Label>
                            <Input
                                id="field_value"
                                value={fieldValue}
                                onChange={(e) => setFieldValue(e.target.value)}
                                placeholder="مثال: 15000000"
                                className="bg-white"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-br">
                            <Button variant="outline" onClick={handleCloseDialog}>انصراف</Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
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
                        <AlertDialogTitle>حذف فیلد</AlertDialogTitle>
                        <AlertDialogDescription>
                            آیا از حذف این فیلد اطمینان دارید؟ این عمل غیرقابل بازگشت است.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>انصراف</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-1 hover:bg-red-2">حذف</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
