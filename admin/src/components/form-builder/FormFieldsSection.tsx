"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/elements/Button";
import { ProtectedButton, useUIPermissions } from '@/core/permissions';
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { Textarea } from "@/components/elements/Textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/elements/Select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/elements/DropdownMenu";
import { Checkbox } from "@/components/elements/Checkbox";
import { formApi } from "@/api/form-builder/route";
import { ContactFormField, ContactFormFieldCreate } from "@/types/form/contactForm";
import { toast } from "@/components/elements/Sonner";
import { Plus, Edit, Trash2, FileText, Loader2, Globe, Smartphone, MoreVertical } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/elements/Table";
import { Badge } from "@/components/elements/Badge";
import { Skeleton } from "@/components/elements/Skeleton";

export function FormFieldsSection() {
    const [fields, setFields] = useState<ContactFormField[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingField, setEditingField] = useState<ContactFormField | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [fieldToDelete, setFieldToDelete] = useState<number | null>(null);
    
    const { canManageForms } = useUIPermissions();
    
    const [fieldKey, setFieldKey] = useState("");
    const [fieldType, setFieldType] = useState<ContactFormField['field_type']>('text');
    const [label, setLabel] = useState("");
    const [placeholder, setPlaceholder] = useState("");
    const [required, setRequired] = useState(true);
    const [platforms, setPlatforms] = useState<string[]>(['website']);
    const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);
    const [order, setOrder] = useState(0);
    const [isActive, setIsActive] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchFields();
    }, []);

    const fetchFields = async () => {
        setLoading(true);
        const data = await formApi.getFields();
        setFields(Array.isArray(data) ? data : []);
        setLoading(false);
    };

    const handleOpenDialog = (field?: ContactFormField) => {
        if (field) {
            setEditingField(field);
            setFieldKey(field.field_key);
            setFieldType(field.field_type);
            setLabel(field.label);
            setPlaceholder(field.placeholder || "");
            setRequired(field.required);
            setPlatforms(field.platforms || []);
            setOptions(field.options || []);
            setOrder(field.order);
            setIsActive(field.is_active);
        } else {
            setEditingField(null);
            setFieldKey("");
            setFieldType('text');
            setLabel("");
            setPlaceholder("");
            setRequired(true);
            setPlatforms(['website']);
            setOptions([]);
            setOrder(0);
            setIsActive(true);
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingField(null);
        setFieldKey("");
        setFieldType('text');
        setLabel("");
        setPlaceholder("");
        setRequired(true);
        setPlatforms(['website']);
        setOptions([]);
        setOrder(0);
        setIsActive(true);
    };

    const handlePlatformToggle = (platform: string) => {
        setPlatforms(prev => {
            if (prev.includes(platform)) {
                return prev.filter(p => p !== platform);
            } else {
                return [...prev, platform];
            }
        });
    };

    const handleAddOption = () => {
        setOptions([...options, { value: '', label: '' }]);
    };

    const handleOptionChange = (index: number, field: 'value' | 'label', value: string) => {
        const newOptions = [...options];
        newOptions[index][field] = value;
        setOptions(newOptions);
    };

    const handleRemoveOption = (index: number) => {
        setOptions(options.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        // Validate field_key
        const trimmedFieldKey = fieldKey.trim();
        if (!trimmedFieldKey) {
            toast.error("کلید فیلد الزامی است");
            return;
        }
        
        // Validate field_key format (must start with letter or underscore, only letters, numbers, underscores)
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmedFieldKey)) {
            toast.error("کلید فیلد باید با حرف یا underscore شروع شود و فقط شامل حروف انگلیسی، اعداد و underscore باشد");
            return;
        }
        
        if (trimmedFieldKey.length < 2) {
            toast.error("کلید فیلد باید حداقل 2 کاراکتر باشد");
            return;
        }
        
        if (!label.trim()) {
            toast.error("برچسب فیلد الزامی است");
            return;
        }
        
        if (platforms.length === 0) {
            toast.error("حداقل یک پلتفرم باید انتخاب شود");
            return;
        }
        
        // Validate options for select/radio fields
        if (fieldType === 'select' || fieldType === 'radio') {
            const validOptions = options.filter(opt => opt.value && opt.label);
            if (validOptions.length === 0) {
                toast.error("فیلدهای انتخابی باید حداقل یک گزینه معتبر (با مقدار و برچسب) داشته باشند");
                return;
            }
            
            // Check for duplicate values
            const values = validOptions.map(opt => opt.value.trim().toLowerCase());
            const uniqueValues = new Set(values);
            if (values.length !== uniqueValues.size) {
                toast.error("مقادیر گزینه‌ها نمی‌توانند تکراری باشند");
                return;
            }
        }

        setSaving(true);
        
        const fieldData: ContactFormFieldCreate = {
            field_key: trimmedFieldKey,
            field_type: fieldType,
            label: label.trim(),
            placeholder: placeholder.trim() || null,
            required,
            platforms,
            order,
            is_active: isActive,
        };

        if (fieldType === 'select' || fieldType === 'radio') {
            // Filter and trim options
            fieldData.options = options
                .filter(opt => opt.value && opt.label)
                .map(opt => ({
                    value: opt.value.trim(),
                    label: opt.label.trim()
                }));
        }

        try {
            if (editingField) {
                await formApi.updateField(editingField.id, fieldData);
            } else {
                await formApi.createField(fieldData);
            }
            handleCloseDialog();
            await fetchFields();
        } catch (error: any) {
            // Error is already shown by fetchApi, but we can add additional handling if needed
            if (error?.response?.errors) {
                const errorMessages = Object.values(error.response.errors).flat();
                if (errorMessages.length > 0) {
                    // Additional error details if needed
                    console.error('Field creation/update errors:', errorMessages);
                }
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (id: number) => {
        setFieldToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!fieldToDelete) return;

        await formApi.deleteField(fieldToDelete);
        await fetchFields();
        setDeleteDialogOpen(false);
        setFieldToDelete(null);
    };

    const getFieldTypeLabel = (type: ContactFormField['field_type']) => {
        const labels: Record<ContactFormField['field_type'], string> = {
            text: 'متن',
            email: 'ایمیل',
            phone: 'شماره تلفن',
            textarea: 'متن چندخطی',
            select: 'انتخابی',
            checkbox: 'چک باکس',
            radio: 'رادیو',
            number: 'عدد',
            date: 'تاریخ',
            url: 'لینک',
        };
        return labels[type] || type;
    };

    if (loading) {
        return (
            <CardWithIcon
                icon={FileText}
                title="فیلدهای فرم تماس"
                iconBgColor="bg-blue"
                iconColor="stroke-blue-2"
                borderColor="border-b-blue-1"
            >
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </CardWithIcon>
        );
    }

    return (
        <>
            <CardWithIcon
                icon={FileText}
                title="فیلدهای فرم تماس"
                iconBgColor="bg-blue"
                iconColor="stroke-blue-2"
                borderColor="border-b-blue-1"
                className="hover:shadow-lg transition-all duration-300"
                headerClassName="pb-3"
                titleExtra={
                    <Button onClick={() => handleOpenDialog()}>
                        <Plus />
                        افزودن فیلد
                    </Button>
                }
            >
                    {fields.length === 0 ? (
                        <div className="text-center py-12 text-font-s">
                            فیلدی ثبت نشده است
                        </div>
                    ) : (
                        <div className="rounded-lg border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-bg/50 hover:bg-bg/50">
                                        <TableHead className="text-right">کلید فیلد</TableHead>
                                        <TableHead className="text-right">برچسب</TableHead>
                                        <TableHead className="text-right">نوع</TableHead>
                                        <TableHead className="text-right">پلتفرم</TableHead>
                                        <TableHead className="w-24 text-right">ترتیب</TableHead>
                                        <TableHead className="w-[60px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fields.map((field) => (
                                        <TableRow key={field.id} className="hover:bg-bg/50 transition-colors">
                                            <TableCell className="text-right">
                                                <span className="font-medium font-mono text-sm">{field.field_key}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{field.label}</span>
                                                    {field.required && (
                                                        <Badge variant="red" className="text-xs">الزامی</Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="outline">{getFieldTypeLabel(field.field_type)}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex gap-1">
                                                    {field.platforms.includes('website') && (
                                                        <Badge variant="blue" className="text-xs flex items-center gap-1">
                                                            <Globe className="h-3 w-3" />
                                                            وب
                                                        </Badge>
                                                    )}
                                                    {field.platforms.includes('mobile_app') && (
                                                        <Badge variant="green" className="text-xs flex items-center gap-1">
                                                            <Smartphone className="h-3 w-3" />
                                                            اپ
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-bg rounded-md">
                                                    {field.order}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                                className="flex h-8 w-8 p-0 data-[state=open]:bg-bg"
                                                    >
                                                                <MoreVertical className="h-4 w-4" />
                                                                <span className="sr-only">باز کردن منو</span>
                                                    </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="start" className="w-[160px]">
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleOpenDialog(field);
                                                                }}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                                ویرایش
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteClick(field.id);
                                                                }}
                                                                variant="destructive"
                                                    >
                                                                <Trash2 className="h-4 w-4" />
                                                                حذف
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
            </CardWithIcon>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingField ? "ویرایش فیلد فرم" : "افزودن فیلد فرم"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="field_key">کلید فیلد * (فقط حروف انگلیسی، اعداد و underscore)</Label>
                                <Input
                                    id="field_key"
                                    value={fieldKey}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        // Only allow valid characters
                                        if (/^[a-zA-Z0-9_]*$/.test(value)) {
                                            setFieldKey(value);
                                        }
                                    }}
                                    placeholder="مثال: name, email, phone_number"
                                    disabled={!!editingField}
                                    className="font-mono"
                                />
                                <p className="text-xs text-font-s">
                                    باید با حرف یا underscore شروع شود. فقط حروف انگلیسی، اعداد و underscore مجاز است.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="field_type">نوع فیلد *</Label>
                                <Select value={fieldType} onValueChange={(value) => setFieldType(value as ContactFormField['field_type'])}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="text">متن</SelectItem>
                                        <SelectItem value="email">ایمیل</SelectItem>
                                        <SelectItem value="phone">شماره تلفن</SelectItem>
                                        <SelectItem value="textarea">متن چندخطی</SelectItem>
                                        <SelectItem value="select">انتخابی</SelectItem>
                                        <SelectItem value="radio">رادیو</SelectItem>
                                        <SelectItem value="checkbox">چک باکس</SelectItem>
                                        <SelectItem value="number">عدد</SelectItem>
                                        <SelectItem value="date">تاریخ</SelectItem>
                                        <SelectItem value="url">لینک</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="label">برچسب *</Label>
                            <Input
                                id="label"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                placeholder="نام و نام خانوادگی"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="placeholder">متن راهنما</Label>
                            <Input
                                id="placeholder"
                                value={placeholder}
                                onChange={(e) => setPlaceholder(e.target.value)}
                                placeholder="مثال: نام خود را وارد کنید"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>پلتفرم‌ها *</Label>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="platform_website"
                                        checked={platforms.includes('website')}
                                        onCheckedChange={() => handlePlatformToggle('website')}
                                    />
                                    <Label htmlFor="platform_website" className="cursor-pointer flex items-center gap-1">
                                        <Globe className="h-4 w-4" />
                                        وب‌سایت
                                    </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="platform_mobile"
                                        checked={platforms.includes('mobile_app')}
                                        onCheckedChange={() => handlePlatformToggle('mobile_app')}
                                    />
                                    <Label htmlFor="platform_mobile" className="cursor-pointer flex items-center gap-1">
                                        <Smartphone className="h-4 w-4" />
                                        اپلیکیشن
                                    </Label>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="required"
                                    checked={required}
                                    onCheckedChange={(checked) => setRequired(checked as boolean)}
                                />
                                <Label htmlFor="required" className="cursor-pointer">
                                    فیلد الزامی است
                                </Label>
                            </div>

                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="is_active"
                                    checked={isActive}
                                    onCheckedChange={(checked) => setIsActive(checked as boolean)}
                                />
                                <Label htmlFor="is_active" className="cursor-pointer">
                                    فعال
                                </Label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="order">ترتیب نمایش</Label>
                            <Input
                                id="order"
                                type="number"
                                value={order}
                                onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                                min="0"
                            />
                        </div>

                        {(fieldType === 'select' || fieldType === 'radio') && (
                            <div className="space-y-3 border-t pt-4 bg-bg/30 p-4 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-base font-semibold">گزینه‌ها *</Label>
                                        <p className="text-xs text-font-s mt-1">
                                            برای فیلدهای {fieldType === 'select' ? 'انتخابی' : 'رادیو'} باید حداقل یک گزینه تعریف کنید
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAddOption}
                                    >
                                        <Plus className="h-4 w-4" />
                                        افزودن گزینه
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {options.map((option, index) => {
                                        const validOptions = options.filter(opt => opt.value && opt.label);
                                        const duplicateValue = validOptions.filter(opt => 
                                            opt.value.trim().toLowerCase() === option.value.trim().toLowerCase()
                                        ).length > 1;
                                        
                                        return (
                                            <div key={index} className="flex gap-2 items-start p-3 bg-white dark:bg-gray-800 rounded-md border">
                                                <div className="flex-1 space-y-2">
                                                    <div>
                                                        <Label className="text-xs text-font-s mb-1 block">مقدار (Value) *</Label>
                                                        <Input
                                                            placeholder="مثال: iran, usa, uk"
                                                            value={option.value}
                                                            onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
                                                            className={duplicateValue && option.value ? "border-red-500" : ""}
                                                        />
                                                        {duplicateValue && option.value && (
                                                            <p className="text-xs text-red-500 mt-1">مقدار تکراری است</p>
                                                        )}
                                                        <p className="text-xs text-font-s mt-1">مقداری که در کد استفاده می‌شود</p>
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs text-font-s mb-1 block">برچسب (Label) *</Label>
                                                        <Input
                                                            placeholder="مثال: ایران, آمریکا, انگلیس"
                                                            value={option.label}
                                                            onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
                                                        />
                                                        <p className="text-xs text-font-s mt-1">متن نمایش داده شده به کاربر</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleRemoveOption(index)}
                                                    className="mt-6"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        );
                                    })}
                                    {options.length === 0 && (
                                        <div className="text-center py-6 border-2 border-dashed rounded-lg bg-bg/50">
                                            <p className="text-sm text-font-s mb-2">
                                                هنوز گزینه‌ای اضافه نشده است
                                            </p>
                                            <p className="text-xs text-font-s">
                                                روی دکمه "افزودن گزینه" کلیک کنید
                                            </p>
                                        </div>
                                    )}
                                    {options.length > 0 && options.filter(opt => opt.value && opt.label).length === 0 && (
                                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                                            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                                                ⚠️ حداقل یک گزینه معتبر (با مقدار و برچسب) اضافه کنید
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button variant="outline" onClick={handleCloseDialog}>
                                انصراف
                            </Button>
                            <ProtectedButton 
                                onClick={handleSave} 
                                permission="forms.manage"
                                disabled={saving}
                                showDenyToast={true}
                                denyMessage="شما دسترسی لازم برای مدیریت فرم‌ها را ندارید"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="animate-spin" />
                                        در حال ذخیره...
                                    </>
                                ) : (
                                    "ذخیره"
                                )}
                            </ProtectedButton>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>حذف فیلد فرم</AlertDialogTitle>
                        <AlertDialogDescription>
                            آیا از حذف این فیلد اطمینان دارید؟ این عمل غیرقابل بازگشت است.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>انصراف</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

