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
import { Badge } from "@/components/elements/Badge";
import { Settings, Home, Building2, Calendar, ChevronDown, ChevronUp, Loader2, Compass, MapPin, X } from "lucide-react";
import { realEstateApi } from "@/api/real-estate";

interface ExtraAttributesTabProps {
    formData: any;
    handleInputChange: (field: string, value: any) => void;
    editMode: boolean;
}

interface FieldMetadata {
    key: string;
    label: string;
    type: 'select' | 'number' | 'text';
    icon?: any;
    options?: Array<{ value: string; label: string }>;
    min?: number;
    max?: number;
    placeholder?: string;
}

// TypeScript interface for API response
interface FieldOptionsResponse {
    bedrooms: [number, string][];
    bathrooms: [number, string][];
    parking_spaces: [number, string][];
    storage_rooms: [number, string][];
    floor_number: [number, string][];
    kitchens: [number, string][];
    living_rooms: [number, string][];
    document_type: [string, string][];
    year_built: {
        min: number;
        max: number;
        placeholder: string;
        help_text: string;
    };
    extra_attributes_options?: {
        space_type?: [string, string][];
        construction_status?: [string, string][];
        property_condition?: [string, string][];
        property_direction?: [string, string][];
        city_position?: [string, string][];
        unit_type?: [string, string][];
    };
}

export function ExtraAttributesTab({
    formData,
    handleInputChange,
    editMode,
}: ExtraAttributesTabProps) {
    const [showCommon, setShowCommon] = useState(true);
    const [showPreSale, setShowPreSale] = useState(false);
    const [showShortTerm, setShowShortTerm] = useState(false);
    const [showCustom, setShowCustom] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    // داده‌های دینامیک از بک‌اند
    const [commonAttributes, setCommonAttributes] = useState<FieldMetadata[]>([]);
    const [preSaleAttributes, setPreSaleAttributes] = useState<FieldMetadata[]>([]);
    const [shortTermAttributes, setShortTermAttributes] = useState<FieldMetadata[]>([]);
    
    // فیلدهای دلخواه کاربر
    const [customKey, setCustomKey] = useState("");
    const [customValue, setCustomValue] = useState("");

    const currentAttributes = formData?.extra_attributes || {};



    // دریافت metadata از بک‌اند
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                setIsLoading(true);
                const options = await realEstateApi.getFieldOptions() as FieldOptionsResponse;
                
                // تبدیل داده‌های بک‌اند به فرمت مورد نیاز کامپوننت
                const extraOptions = options.extra_attributes_options || {};
                
                // ✅ فیلدهای مشترک (همه نوع ملک)
                const common: FieldMetadata[] = [];
                if (extraOptions.property_condition) {
                    common.push({
                        key: 'property_condition',
                        label: 'وضعیت ملک',
                        type: 'select',
                        icon: Building2,
                        options: extraOptions.property_condition.map((item: any) => ({
                            value: item[0],
                            label: item[1]
                        }))
                    });
                }
                if (extraOptions.property_direction) {
                    common.push({
                        key: 'property_direction',
                        label: 'جهت ملک',
                        type: 'select',
                        icon: Compass,
                        options: extraOptions.property_direction.map((item: any) => ({
                            value: item[0],
                            label: item[1]
                        }))
                    });
                }
                if (extraOptions.city_position) {
                    common.push({
                        key: 'city_position',
                        label: 'موقعیت در شهر',
                        type: 'select',
                        icon: MapPin,
                        options: extraOptions.city_position.map((item: any) => ({
                            value: item[0],
                            label: item[1]
                        }))
                    });
                }
                if (extraOptions.unit_type) {
                    common.push({
                        key: 'unit_type',
                        label: 'نوع واحد',
                        type: 'select',
                        icon: Home,
                        options: extraOptions.unit_type.map((item: any) => ({
                            value: item[0],
                            label: item[1]
                        }))
                    });
                }
                setCommonAttributes(common);
                
                // ✅ فیلدهای پیش‌فروش (فقط برای پروژه‌های در حال ساخت)
                const preSale: FieldMetadata[] = [];
                if (extraOptions.construction_status) {
                    preSale.push({
                        key: 'construction_status',
                        label: 'وضعیت ساخت',
                        type: 'select',
                        icon: Building2,
                        options: extraOptions.construction_status.map((item: any) => ({
                            value: item[0],
                            label: item[1]
                        }))
                    });
                }
                setPreSaleAttributes(preSale);
                
                // ✅ فیلدهای اجاره کوتاه‌مدت (فقط برای مهمان‌پذیر)
                const shortTerm: FieldMetadata[] = [];
                if (extraOptions.space_type) {
                    shortTerm.push({
                        key: 'space_type',
                        label: 'نوع کاربری فضا',
                        type: 'select',
                        icon: Home,
                        options: extraOptions.space_type.map((item: any) => ({
                            value: item[0],
                            label: item[1]
                        }))
                    });
                }
                setShortTermAttributes(shortTerm);
                
            } catch (error) {
                console.error('Error fetching field metadata:', error);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchMetadata();
    }, []);

    // بررسی ویژگی‌های موجود برای نمایش بخش‌ها
    useEffect(() => {
        // اگر فیلد پیش‌فروش داره → نمایش بخش پیش‌فروش
        if (currentAttributes.construction_status) {
            setShowPreSale(true);
        }
        // اگر فیلد اجاره کوتاه‌مدت داره → نمایش بخش اجاره کوتاه‌مدت
        if (currentAttributes.space_type) {
            setShowShortTerm(true);
        }
    }, []);

    // تابع برای به‌روزرسانی مقدار یک ویژگی
    const handleAttributeChange = (key: string, value: any) => {
        if (!editMode) return;
        
        const newAttributes = {
            ...currentAttributes,
            [key]: value
        };
        
        handleInputChange("extra_attributes", newAttributes);
    };
    
    // تابع برای اضافه کردن فیلد دلخواه
    const handleAddCustomField = () => {
        if (!editMode || !customKey.trim()) return;
        
        const newAttributes = {
            ...currentAttributes,
            [customKey.trim()]: customValue.trim() || null
        };
        
        handleInputChange("extra_attributes", newAttributes);
        setCustomKey("");
        setCustomValue("");
    };
    
    // تابع برای حذف یک فیلد
    const handleRemoveField = (key: string) => {
        if (!editMode) return;
        
        const newAttributes = { ...currentAttributes };
        delete newAttributes[key];
        
        handleInputChange("extra_attributes", newAttributes);
    };

    // رندر یک فیلد ویژگی
    const renderAttributeField = (attr: FieldMetadata) => {
        const value = currentAttributes[attr.key];
        const Icon = attr.icon;

        if (attr.type === 'select') {
            return (
                <div key={attr.key} className="space-y-2">
                    <Label className="flex items-center gap-2">
                        {Icon && <Icon className="w-4 h-4" />}
                        {attr.label}
                    </Label>
                    <Select
                        value={value || ''}
                        onValueChange={(val) => handleAttributeChange(attr.key, val)}
                        disabled={!editMode}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="انتخاب کنید" />
                        </SelectTrigger>
                        <SelectContent>
                            {attr.options?.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            );
        }

        if (attr.type === 'number') {
            return (
                <div key={attr.key} className="space-y-2">
                    <Label className="flex items-center gap-2">
                        {Icon && <Icon className="w-4 h-4" />}
                        {attr.label}
                    </Label>
                    <Input
                        type="number"
                        value={value || ''}
                        onChange={(e) => {
                            const val = e.target.value ? Number(e.target.value) : null;
                            handleAttributeChange(attr.key, val);
                        }}
                        disabled={!editMode}
                        min={attr.min}
                        max={attr.max}
                        placeholder={attr.placeholder || 'مثال: 0'}
                    />
                </div>
            );
        }

        if (attr.type === 'text') {
            return (
                <div key={attr.key} className="space-y-2">
                    <Label className="flex items-center gap-2">
                        {Icon && <Icon className="w-4 h-4" />}
                        {attr.label}
                    </Label>
                    <Input
                        type="text"
                        value={value || ''}
                        onChange={(e) => handleAttributeChange(attr.key, e.target.value)}
                        disabled={!editMode}
                        placeholder={attr.placeholder || ''}
                    />
                </div>
            );
        }

        return null;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="mr-3 text-muted-foreground">در حال بارگذاری...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* توضیحات */}
            <CardWithIcon
                icon={Settings}
                title="فیلدهای اضافی"
                iconBgColor="bg-purple"
                iconColor="stroke-purple-2"
                borderColor="border-b-purple-1"
            >
                <div className="text-sm text-muted-foreground">
                    این بخش برای ویژگی‌های اختصاصی ملک شماست. 
                    <strong>تمام فیلدها اختیاری هستند</strong> و فقط بخش‌هایی که نیاز دارید را پر کنید.
                </div>
            </CardWithIcon>

            {/* اضافه کردن فیلد دلخواه */}
            {editMode && (
                <CardWithIcon
                    icon={Settings}
                    title="اضافه کردن فیلد دلخواه"
                    iconBgColor="bg-indigo"
                    iconColor="stroke-indigo-2"
                    borderColor="border-b-indigo-1"
                >
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCustom(!showCustom)}
                        className="mb-4 w-full flex items-center justify-between"
                    >
                        <span>اضافه کردن ویژگی جدید</span>
                        {showCustom ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                    
                    {showCustom && (
                        <div className="space-y-4">
                            <div className="text-sm text-muted-foreground mb-3">
                                می‌توانید فیلدهای اختصاصی دیگری برای این ملک اضافه کنید.
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>نام فیلد (انگلیسی)</Label>
                                    <Input
                                        type="text"
                                        value={customKey}
                                        onChange={(e) => setCustomKey(e.target.value)}
                                        placeholder="مثال: balcony_size"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>مقدار</Label>
                                    <Input
                                        type="text"
                                        value={customValue}
                                        onChange={(e) => setCustomValue(e.target.value)}
                                        placeholder="مثال: 15 متر"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <Button
                                        type="button"
                                        onClick={handleAddCustomField}
                                        disabled={!customKey.trim()}
                                        className="w-full"
                                    >
                                        اضافه کردن
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardWithIcon>
            )}

            {/* ویژگی‌های مشترک */}
            {commonAttributes.length > 0 && (
                <CardWithIcon
                    icon={Building2}
                    title="مشخصات عمومی"
                    iconBgColor="bg-blue"
                    iconColor="stroke-blue-2"
                    borderColor="border-b-blue-1"
                >
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCommon(!showCommon)}
                        className="mb-4 w-full flex items-center justify-between"
                    >
                        <span>ویژگی‌های عمومی (وضعیت، جهت، موقعیت، نوع واحد)</span>
                        {showCommon ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                    
                    {showCommon && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {commonAttributes.map(attr => renderAttributeField(attr))}
                        </div>
                    )}
                </CardWithIcon>
            )}

            {/* ویژگی‌های پیش‌فروش */}
            {preSaleAttributes.length > 0 && (
                <CardWithIcon
                    icon={Building2}
                    title="مشخصات پیش‌فروش"
                    iconBgColor="bg-green"
                    iconColor="stroke-green-2"
                    borderColor="border-b-green-1"
                >
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPreSale(!showPreSale)}
                        className="mb-4 w-full flex items-center justify-between"
                    >
                        <span>ویژگی‌های پیش‌فروش (وضعیت ساخت)</span>
                        {showPreSale ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                    
                    {showPreSale && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {preSaleAttributes.map(attr => renderAttributeField(attr))}
                        </div>
                    )}
                </CardWithIcon>
            )}

            {/* ویژگی‌های اجاره کوتاه‌مدت */}
            {shortTermAttributes.length > 0 && (
                <CardWithIcon
                    icon={Home}
                    title="مشخصات اجاره کوتاه‌مدت"
                    iconBgColor="bg-orange"
                    iconColor="stroke-orange-2"
                    borderColor="border-b-orange-1"
                >
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowShortTerm(!showShortTerm)}
                        className="mb-4 w-full flex items-center justify-between"
                    >
                        <span>ویژگی‌های اجاره کوتاه‌مدت (نوع کاربری فضا)</span>
                        {showShortTerm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                    
                    {showShortTerm && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {shortTermAttributes.map(attr => renderAttributeField(attr))}
                        </div>
                    )}
                </CardWithIcon>
            )}

            {/* نمایش ویژگی‌های فعلی */}
            {Object.keys(currentAttributes).length > 0 && (
                <CardWithIcon
                    icon={Settings}
                    title="ویژگی‌های ذخیره شده"
                    iconBgColor="bg-purple"
                    iconColor="stroke-purple-2"
                    borderColor="border-b-purple-1"
                >
                    <div className="space-y-2">
                        <div className="text-sm text-muted-foreground mb-3">
                            ویژگی‌هایی که برای این ملک ثبت شده‌اند:
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(currentAttributes).map(([key, value]) => {
                                // پیدا کردن لیبل فارسی
                                const attr = [...commonAttributes, ...preSaleAttributes, ...shortTermAttributes]
                                    .find(a => a.key === key);
                                const label = attr?.label || key;
                                
                                // پیدا کردن label مقدار برای select ها
                                let displayValue = String(value);
                                if (attr?.type === 'select' && attr.options) {
                                    const option = attr.options.find(o => o.value === value);
                                    if (option) {
                                        displayValue = option.label;
                                    }
                                }
                                
                                return (
                                    <Badge key={key} variant="outline" className="flex items-center gap-2">
                                        <span className="text-xs">
                                            {label}: <strong>{displayValue}</strong>
                                        </span>
                                        {editMode && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveField(key)}
                                                className="ml-1 hover:text-red-1"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </Badge>
                                );
                            })}
                        </div>
                    </div>
                </CardWithIcon>
            )}
        </div>
    );
}

export default ExtraAttributesTab;
