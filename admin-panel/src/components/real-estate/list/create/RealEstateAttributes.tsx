import { useState, useEffect } from "react";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Label } from "@/components/elements/Label";
import { Input } from "@/components/elements/Input";
import { Button } from "@/components/elements/Button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/elements/Select";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/elements/Table";
import { DataTableRowActions } from "@/components/tables/DataTableRowActions";
import { Settings, Plus, Edit, Trash2, Loader2, Key, Building2, Compass, MapPin, Home, FileJson } from "lucide-react";
import { realEstateApi } from "@/api/real-estate";
import { showError } from "@/core/toast";
import { Skeleton } from "@/components/elements/Skeleton";

interface ExtraAttributesTabProps {
    formData: any;
    handleInputChange: (field: string, value: any) => void;
    editMode: boolean;
}

const PREDEFINED_KEYS = [
    'property_condition',
    'property_direction',
    'city_position',
    'unit_type',
    'construction_status',
    'space_type'
];

export function RealEstateAttributes({
    formData,
    handleInputChange,
    editMode,
}: ExtraAttributesTabProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [fieldOptions, setFieldOptions] = useState<any>(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [keyToDelete, setKeyToDelete] = useState<string | null>(null);

    const [fieldKey, setFieldKey] = useState("");
    const [fieldValue, setFieldValue] = useState("");
    const [saving, setSaving] = useState(false);

    const currentAttributes = formData?.extra_attributes || {};

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                setIsLoading(true);
                const options = await realEstateApi.getFieldOptions();
                setFieldOptions(options.extra_attributes_options || {});
            } catch (error) {
            } finally {
                setIsLoading(false);
            }
        };
        fetchMetadata();
    }, []);

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

        if (!editingKey && currentAttributes[fieldKey.trim()]) {
            showError("این نام فیلد قبلاً استفاده شده است");
            return;
        }

        setSaving(true);
        const newAttributes = {
            ...currentAttributes,
            [fieldKey.trim()]: fieldValue.trim() || null
        };

        if (editingKey && editingKey !== fieldKey.trim()) {
            delete newAttributes[editingKey];
        }

        handleInputChange("extra_attributes", newAttributes);
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
        handleInputChange("extra_attributes", newAttributes);
        setDeleteDialogOpen(false);
        setKeyToDelete(null);
    };

    const handleAttributeChange = (key: string, value: any) => {
        if (!editMode) return;
        const newAttributes = { ...currentAttributes };

        if (value === "__none__" || value === "") {
            delete newAttributes[key];
        } else {
            newAttributes[key] = value;
        }

        handleInputChange("extra_attributes", newAttributes);
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <CardWithIcon
                    icon={Building2}
                    title="مشخصات تکمیلی (استاندارد)"
                    iconBgColor="bg-indigo-0"
                    iconColor="stroke-indigo-1"
                    borderColor="border-b-indigo-1"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="flex flex-col p-3 border border-br rounded-xl bg-wt/50">
                                <div className="flex items-center gap-3 mb-3">
                                    <Skeleton className="w-9 h-9 rounded-lg" />
                                    <div className="flex flex-col gap-1.5 flex-1">
                                        <Skeleton className="h-2 w-12" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                </div>
                                <Skeleton className="h-9 w-full rounded-lg" />
                            </div>
                        ))}
                    </div>
                </CardWithIcon>
            </div>
        );
    }

    const customAttributes = Object.entries(currentAttributes).filter(([key]) => !PREDEFINED_KEYS.includes(key));

    return (
        <div className="space-y-6">
            {/* Standard Attributes Section */}
            <CardWithIcon
                icon={Building2}
                title="مشخصات تکمیلی (استاندارد)"
                iconBgColor="bg-indigo"
                iconColor="stroke-indigo-2"
                borderColor="border-b-indigo-1"
                headerClassName="pb-3"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { key: 'property_condition', label: 'وضعیت ملک', icon: Building2 },
                        { key: 'property_direction', label: 'جهت ملک', icon: Compass },
                        { key: 'city_position', label: 'موقعیت در شهر', icon: MapPin },
                        { key: 'unit_type', label: 'نوع واحد', icon: Home },
                        { key: 'construction_status', label: 'وضعیت ساخت', icon: Building2 },
                        { key: 'space_type', label: 'نوع کاربری', icon: Home },
                    ].map((field) => (
                        <div
                            key={field.key}
                            className="group flex flex-col p-3 border border-br rounded-xl bg-wt hover:border-indigo-1/30 transition-all duration-200"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-9 h-9 rounded-lg bg-indigo-0 flex items-center justify-center group-hover:bg-indigo-1/10 transition-colors">
                                    <field.icon className="w-4 h-4 text-indigo-1" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <label className="text-[10px] font-bold text-font-s/60 uppercase">
                                        {field.label}
                                    </label>
                                    <span className="text-font-s font-semibold text-font-p truncate">
                                        {fieldOptions?.[field.key]?.find((opt: any) => opt[0] === currentAttributes[field.key])?.[1] || "تنظیم نشده"}
                                    </span>
                                </div>
                            </div>

                            <Select
                                value={currentAttributes[field.key] || ''}
                                onValueChange={(val) => handleAttributeChange(field.key, val)}
                                disabled={!editMode}
                            >
                                <SelectTrigger className="w-full bg-muted/5 border-br hover:bg-muted/10 transition-all rounded-lg h-9 text-font-s px-3">
                                    <SelectValue placeholder="انتخاب کنید..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__" className="text-red-1 font-bold">
                                        <div className="flex items-center gap-2">
                                            <Trash2 className="w-3 h-3" />
                                            <span>پاک کردن انتخاب</span>
                                        </div>
                                    </SelectItem>
                                    {fieldOptions?.[field.key]?.map((opt: any) => (
                                        <SelectItem key={opt[0]} value={opt[0]}>{opt[1]}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ))}
                </div>
            </CardWithIcon>

            {/* Custom Attributes Table */}
            <CardWithIcon
                icon={FileJson}
                title="سایر اطلاعات و فیلدهای اضافی"
                iconBgColor="bg-purple"
                iconColor="stroke-purple-2"
                borderColor="border-b-purple-1"
                headerClassName="pb-3"
                titleExtra={
                    editMode && (
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
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-0 flex items-center justify-center">
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
                                                <span className="text-font-s text-font-p font-medium">
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
            </CardWithIcon>

            {/* Dialogs */}
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

export default RealEstateAttributes;
