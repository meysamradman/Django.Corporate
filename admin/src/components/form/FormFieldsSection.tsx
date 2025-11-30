/**
 * رنگ‌های استاندارد فیلدهای فرم:
 * - فعال: blue
 * - غیرفعال: gray
 * - الزامی: red
 */
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
import { formApi } from "@/api/form/route";
import { ContactFormField, ContactFormFieldCreate } from "@/types/form/contactForm";
import { toast } from "@/components/elements/Sonner";
import { Plus, Edit, Trash2, FileText, Loader2, Globe, Smartphone, MoreVertical } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/elements/Table";
import { Badge } from "@/components/elements/Badge";

export function FormFieldsSection() {
    const [fields, setFields] = useState<ContactFormField[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingField, setEditingField] = useState<ContactFormField | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [fieldToDelete, setFieldToDelete] = useState<number | null>(null);
    
    // 🚀 Pre-computed permission flag
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
        try {
            setLoading(true);
            const data = await formApi.getFields();
            setFields(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error("خطا در دریافت فیلدهای فرم");
        } finally {
            setLoading(false);
        }
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
        if (!fieldKey.trim()) {
            toast.error("کلید فیلد الزامی است");
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
        if ((fieldType === 'select' || fieldType === 'radio') && options.length === 0) {
            toast.error("فیلدهای انتخابی باید حداقل یک گزینه داشته باشند");
            return;
        }

        try {
            setSaving(true);
            
            const fieldData: ContactFormFieldCreate = {
                field_key: fieldKey.trim(),
                field_type: fieldType,
                label: label.trim(),
                placeholder: placeholder.trim() || null,
                required,
                platforms,
                order,
                is_active: isActive,
            };

            if (fieldType === 'select' || fieldType === 'radio') {
                fieldData.options = options.filter(opt => opt.value && opt.label);
            }

            if (editingField) {
                await formApi.updateField(editingField.id, fieldData);
                toast.success("فیلد با موفقیت به‌روزرسانی شد");
            } else {
                await formApi.createField(fieldData);
                toast.success("فیلد با موفقیت ایجاد شد");
            }
            
            handleCloseDialog();
            await fetchFields();
        } catch (error: any) {
            let errorMessage = "خطا در ذخیره فیلد";
            
            // بررسی خطاهای validation
            if (error?.response?.data?.errors) {
                const errors = error.response.data.errors;
                if (errors.field_key) {
                    errorMessage = Array.isArray(errors.field_key) 
                        ? errors.field_key[0] 
                        : errors.field_key;
                } else if (error?.response?.data?.message) {
                    errorMessage = error.response.data.message;
                }
            } else if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error?.message) {
                errorMessage = error.message;
            }
            
            toast.error(errorMessage);
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

        try {
            await formApi.deleteField(fieldToDelete);
            toast.success("فیلد با موفقیت حذف شد");
            await fetchFields();
            setDeleteDialogOpen(false);
            setFieldToDelete(null);
        } catch (error) {
            toast.error("خطا در حذف فیلد");
        }
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
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-font-s" />
            </div>
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
                                    onChange={(e) => setFieldKey(e.target.value)}
                                    placeholder="مثال: name, email, phone_number"
                                    disabled={!!editingField}
                                    className="font-mono"
                                />
                                <p className="text-xs text-font-s">
                                    فقط حروف انگلیسی، اعداد و underscore
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
                            <div className="space-y-2 border-t pt-4">
                                <div className="flex items-center justify-between">
                                    <Label>گزینه‌ها *</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAddOption}
                                    >
                                        <Plus />
                                        افزودن گزینه
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {options.map((option, index) => (
                                        <div key={index} className="flex gap-2">
                                            <Input
                                                placeholder="مقدار (value)"
                                                value={option.value}
                                                onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
                                                className="flex-1"
                                            />
                                            <Input
                                                placeholder="برچسب (label)"
                                                value={option.label}
                                                onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
                                                className="flex-1"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRemoveOption(index)}
                                            >
                                                <Trash2 />
                                            </Button>
                                        </div>
                                    ))}
                                    {options.length === 0 && (
                                        <p className="text-sm text-font-s">
                                            حداقل یک گزینه اضافه کنید
                                        </p>
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

