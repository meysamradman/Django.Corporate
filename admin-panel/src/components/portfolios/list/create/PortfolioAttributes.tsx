import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
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
import { Settings, Plus, Edit, Trash2, Loader2, Key } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/elements/Table";
import { DataTableRowActions } from "@/components/tables/DataTableRowActions";
import type { PortfolioFormValues } from "@/components/portfolios/validations/portfolioSchema";
import { showError } from "@/core/toast";

interface ExtraAttributesTabFormProps {
    form: UseFormReturn<PortfolioFormValues>;
    editMode: boolean;
}

interface ExtraAttributesTabManualProps {
    formData: any;
    handleInputChange: (field: string, value: any) => void;
    editMode: boolean;
}

type ExtraAttributesTabProps = ExtraAttributesTabFormProps | ExtraAttributesTabManualProps;

export function PortfolioAttributes(props: ExtraAttributesTabProps) {
    const isFormApproach = 'form' in props;
    
    const form = isFormApproach ? props.form : null;
    const watch = isFormApproach ? form?.watch : null;
    const setValue = isFormApproach ? form?.setValue : null;
    
    const formData = isFormApproach ? null : props.formData;
    const handleInputChange = isFormApproach ? null : props.handleInputChange;
    
    const editMode = isFormApproach ? props.editMode : props.editMode;
    
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [keyToDelete, setKeyToDelete] = useState<string | null>(null);
    
    const [fieldKey, setFieldKey] = useState("");
    const [fieldValue, setFieldValue] = useState("");
    const [saving, setSaving] = useState(false);

    const currentAttributes = isFormApproach 
        ? (watch?.("extra_attributes") || {})
        : (formData?.extra_attributes || {});

    const handleOpenDialog = (key?: string) => {
        if (key && currentAttributes[key] !== undefined) {
            setEditingKey(key);
            setFieldKey(key);
            setFieldValue(String(currentAttributes[key] || ""));
        } else {
            setEditingKey(null);
            setFieldKey("");
            setFieldValue("");
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingKey(null);
        setFieldKey("");
        setFieldValue("");
    };

    const handleSave = () => {
        if (!fieldKey.trim()) {
            showError("نام فیلد الزامی است");
            return;
        }

        // اگر در حال ویرایش نیستیم و کلید تکراری است
        if (!editingKey && currentAttributes[fieldKey.trim()]) {
            showError("این نام فیلد قبلاً استفاده شده است");
            return;
        }

        setSaving(true);
        
        const newAttributes = {
            ...currentAttributes,
            [fieldKey.trim()]: fieldValue.trim() || null
        };
        
        // اگر در حال ویرایش بودیم و نام فیلد تغییر کرده، کلید قدیمی را حذف می‌کنیم
        if (editingKey && editingKey !== fieldKey.trim()) {
            delete newAttributes[editingKey];
        }
        
        if (isFormApproach) {
            setValue?.("extra_attributes", newAttributes);
        } else {
            handleInputChange?.("extra_attributes", newAttributes);
        }
        
        setSaving(false);
        handleCloseDialog();
    };

    const handleDeleteClick = (key: string) => {
        setKeyToDelete(key);
        setDeleteDialogOpen(true);
    };

    const handleDelete = () => {
        if (!keyToDelete) return;

        const newAttributes = { ...currentAttributes };
        delete newAttributes[keyToDelete];
        
        if (isFormApproach) {
            setValue?.("extra_attributes", newAttributes);
        } else {
            handleInputChange?.("extra_attributes", newAttributes);
        }
        
        setDeleteDialogOpen(false);
        setKeyToDelete(null);
    };

    const handleValueChange = (key: string, value: string) => {
        if (!editMode) return;
        
        const newAttributes = {
            ...currentAttributes,
            [key]: value
        };
        
        if (isFormApproach) {
            setValue?.("extra_attributes", newAttributes);
        } else {
            handleInputChange?.("extra_attributes", newAttributes);
        }
    };

    return (
        <>
            <CardWithIcon
                icon={Settings}
                title="فیلدهای اضافی"
                iconBgColor="bg-purple"
                iconColor="stroke-purple-2"
                borderColor="border-b-purple-1"
                headerClassName="pb-3"
                titleExtra={
                    editMode && Object.keys(currentAttributes).length > 0 && (
                        <Button 
                            onClick={() => handleOpenDialog()}
                            size="sm"
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            افزودن فیلد جدید
                        </Button>
                    )
                }
            >
                {Object.keys(currentAttributes).length === 0 ? (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-0 mb-4">
                            <Settings className="h-8 w-8 text-purple-1" />
                        </div>
                        <p className="text-font-m text-font-s mb-2">فیلد اضافی ثبت نشده است</p>
                        <p className="text-font-s text-font-s/60 mb-4">برای شروع، فیلد جدید اضافه کنید</p>
                        {editMode && (
                            <Button onClick={() => handleOpenDialog()} variant="outline" size="sm">
                                <Plus className="h-4 w-4 ml-2" />
                                افزودن اولین فیلد
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="border border-br overflow-hidden bg-wt">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-table-header-bg border-b border-br hover:bg-table-header-bg">
                                    <TableHead className="text-right font-semibold text-font-p">
                                        نام فیلد
                                    </TableHead>
                                    <TableHead className="text-right font-semibold text-font-p">
                                        مقدار
                                    </TableHead>
                                    {editMode && (
                                        <TableHead className="w-[80px] text-center font-semibold text-font-p">
                                            عملیات
                                        </TableHead>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Object.entries(currentAttributes).map(([key, value]) => (
                                    <TableRow 
                                        key={key} 
                                        className="hover:bg-purple-0/50 transition-colors border-b border-br last:border-b-0 group"
                                    >
                                        <TableCell className="text-right py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0 w-10 h-10 bg-purple-0 flex items-center justify-center">
                                                    <Key className="h-5 w-5 text-purple-1" />
                                                </div>
                                                <span className="font-semibold text-font-p text-font-m">
                                                    {key}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right py-4">
                                            {editMode ? (
                                                <Input
                                                    type="text"
                                                    value={value ? String(value) : ""}
                                                    onChange={(e) => handleValueChange(key, e.target.value)}
                                                    placeholder="مقدار را وارد کنید"
                                                    className="max-w-md bg-wt"
                                                />
                                            ) : (
                                                <span className="text-font-s text-font-s">
                                                    {value ? String(value) : (
                                                        <span className="text-font-s/60 italic">خالی</span>
                                                    )}
                                                </span>
                                            )}
                                        </TableCell>
                                        {editMode && (
                                            <TableCell className="py-4">
                                                <div className="flex items-center justify-center">
                                                    <DataTableRowActions
                                                        row={{ original: { id: key } } as any}
                                                        actions={[
                                                            {
                                                                label: "ویرایش",
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
            </CardWithIcon>

            {editMode && (
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
                                    <Button variant="outline" onClick={handleCloseDialog}>
                                        انصراف
                                    </Button>
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
                                <AlertDialogAction onClick={handleDelete} className="bg-red-1 hover:bg-red-2">
                                    حذف
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </>
            )}
        </>
    );
}

export default PortfolioAttributes;
