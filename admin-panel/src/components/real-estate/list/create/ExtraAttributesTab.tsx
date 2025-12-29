import { useState } from "react";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Label } from "@/components/elements/Label";
import { Input } from "@/components/elements/Input";
import { Button } from "@/components/elements/Button";
import { Textarea } from "@/components/elements/Textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/elements/Select";
import { Badge } from "@/components/elements/Badge";
import { Trash2, Plus, Copy, FileJson } from "lucide-react";

interface ExtraAttributesTabProps {
    formData: any;
    handleInputChange: (field: string, value: any) => void;
    editMode: boolean;
}

// قالب‌های آماده برای انواع مختلف ملک
const PRESETS = {
    short_term_rental: {
        title: "اجاره کوتاه‌مدت (مهمان‌پذیر)",
        data: {
            min_nights: 2,
            max_guests: 4,
            nightly_rate: null,
            weekly_discount: 10,
            monthly_discount: 20,
            cleaning_fee: null,
            extra_guest_fee: null,
            check_in_time: "14:00",
            check_out_time: "12:00",
            house_rules: "",
        }
    },
    pre_sale: {
        title: "پیش‌فروش",
        data: {
            construction_progress: 0,
            estimated_completion: "",
            payment_plan: "",
            down_payment_percent: 30,
            installments: 36,
            delivery_guarantee: true,
            construction_company: "",
        }
    },
    villa: {
        title: "ویلا / باغ",
        data: {
            pool_size: "",
            garden_area: null,
            bbq_area: false,
            sauna: false,
            jacuzzi: false,
            security_system: "",
            solar_panels: false,
        }
    },
    office: {
        title: "دفتر کار / اداری",
        data: {
            office_type: "open_space",
            workstations: null,
            meeting_rooms: 0,
            server_room: false,
            kitchen: false,
            security_guard: false,
            parking_ratio: "",
            fiber_internet: false,
        }
    }
};

export function ExtraAttributesTab({
    formData,
    handleInputChange,
    editMode,
}: ExtraAttributesTabProps) {
    const [jsonMode, setJsonMode] = useState(false);
    const [jsonText, setJsonText] = useState(
        JSON.stringify(formData?.extra_attributes || {}, null, 2)
    );
    const [jsonError, setJsonError] = useState("");
    const [selectedPreset, setSelectedPreset] = useState<string>("");
    
    // Key-Value mode
    const [newKey, setNewKey] = useState("");
    const [newValue, setNewValue] = useState("");

    const currentAttributes = formData?.extra_attributes || {};

    // Apply preset
    const handleApplyPreset = (presetKey: string) => {
        if (!editMode) return;
        
        const preset = PRESETS[presetKey as keyof typeof PRESETS];
        if (preset) {
            const newAttributes = {
                ...currentAttributes,
                [presetKey]: preset.data
            };
            handleInputChange("extra_attributes", newAttributes);
            setJsonText(JSON.stringify(newAttributes, null, 2));
            setSelectedPreset("");
        }
    };

    // Add new key-value
    const handleAddKeyValue = () => {
        if (!editMode || !newKey.trim()) return;
        
        let parsedValue: any = newValue;
        
        // Try to parse as number
        if (!isNaN(Number(newValue)) && newValue.trim() !== "") {
            parsedValue = Number(newValue);
        }
        // Try to parse as boolean
        else if (newValue.toLowerCase() === "true") {
            parsedValue = true;
        } else if (newValue.toLowerCase() === "false") {
            parsedValue = false;
        }
        // Try to parse as JSON
        else if (newValue.startsWith("{") || newValue.startsWith("[")) {
            try {
                parsedValue = JSON.parse(newValue);
            } catch {
                // Keep as string
            }
        }
        
        const newAttributes = {
            ...currentAttributes,
            [newKey.trim()]: parsedValue
        };
        
        handleInputChange("extra_attributes", newAttributes);
        setJsonText(JSON.stringify(newAttributes, null, 2));
        setNewKey("");
        setNewValue("");
    };

    // Remove key
    const handleRemoveKey = (key: string) => {
        if (!editMode) return;
        
        const newAttributes = { ...currentAttributes };
        delete newAttributes[key];
        
        handleInputChange("extra_attributes", newAttributes);
        setJsonText(JSON.stringify(newAttributes, null, 2));
    };

    // Update JSON text
    const handleJsonChange = (value: string) => {
        setJsonText(value);
        try {
            const parsed = JSON.parse(value);
            setJsonError("");
            handleInputChange("extra_attributes", parsed);
        } catch (e: any) {
            setJsonError(e.message);
        }
    };

    // Copy JSON to clipboard
    const handleCopyJson = () => {
        navigator.clipboard.writeText(jsonText);
    };

    // Format JSON
    const handleFormatJson = () => {
        try {
            const parsed = JSON.parse(jsonText);
            const formatted = JSON.stringify(parsed, null, 2);
            setJsonText(formatted);
            setJsonError("");
        } catch (e: any) {
            setJsonError(e.message);
        }
    };

    return (
        <div className="space-y-6">
            {/* Mode Toggle & Presets */}
            <CardWithIcon
                icon={FileJson}
                title="ویژگی‌های انعطاف‌پذیر"
                iconBgColor="bg-purple"
                iconColor="stroke-purple-2"
                borderColor="border-b-purple-1"
            >
                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant={!jsonMode ? "default" : "outline"}
                                size="sm"
                                onClick={() => setJsonMode(false)}
                                disabled={!editMode}
                            >
                                فرم ساده
                            </Button>
                            <Button
                                type="button"
                                variant={jsonMode ? "default" : "outline"}
                                size="sm"
                                onClick={() => setJsonMode(true)}
                                disabled={!editMode}
                            >
                                JSON ویرایشگر
                            </Button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Label className="text-sm">قالب آماده:</Label>
                            <Select
                                value={selectedPreset}
                                onValueChange={setSelectedPreset}
                                disabled={!editMode}
                            >
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="انتخاب قالب" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(PRESETS).map(([key, preset]) => (
                                        <SelectItem key={key} value={key}>
                                            {preset.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedPreset && (
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => handleApplyPreset(selectedPreset)}
                                    disabled={!editMode}
                                >
                                    اعمال
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                        این بخش برای ذخیره ویژگی‌های خاص و متغیر هر ملک است (مثل: اجاره کوتاه‌مدت، پیش‌فروش، امکانات ویلا)
                    </div>
                </div>
            </CardWithIcon>

            {/* JSON Mode */}
            {jsonMode ? (
                <CardWithIcon
                    icon={FileJson}
                    title="ویرایش JSON"
                    iconBgColor="bg-purple"
                    iconColor="stroke-purple-2"
                    borderColor="border-b-purple-1"
                >
                    <div className="space-y-4">
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleFormatJson}
                                disabled={!editMode}
                            >
                                فرمت کردن
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleCopyJson}
                            >
                                <Copy className="w-4 h-4 ml-2" />
                                کپی
                            </Button>
                        </div>
                        
                        <Textarea
                            value={jsonText}
                            onChange={(e) => handleJsonChange(e.target.value)}
                            disabled={!editMode}
                            className="font-mono text-sm min-h-[400px]"
                            dir="ltr"
                            placeholder='{\n  "key": "value"\n}'
                        />
                        
                        {jsonError && (
                            <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
                                خطا: {jsonError}
                            </div>
                        )}
                    </div>
                </CardWithIcon>
            ) : (
                /* Key-Value Mode */
                <>
                    {/* Add New Key-Value */}
                    <CardWithIcon
                        icon={Plus}
                        title="افزودن ویژگی جدید"
                        iconBgColor="bg-green"
                        iconColor="stroke-green-2"
                        borderColor="border-b-green-1"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>کلید (Key)</Label>
                                <Input
                                    value={newKey}
                                    onChange={(e) => setNewKey(e.target.value)}
                                    placeholder="مثال: min_nights"
                                    disabled={!editMode}
                                    dir="ltr"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>مقدار (Value)</Label>
                                <Input
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                    placeholder='مثال: 2 یا "text" یا true'
                                    disabled={!editMode}
                                    dir="ltr"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="opacity-0">اضافه</Label>
                                <Button
                                    type="button"
                                    onClick={handleAddKeyValue}
                                    disabled={!editMode || !newKey.trim()}
                                    className="w-full"
                                >
                                    <Plus className="w-4 h-4 ml-2" />
                                    اضافه کردن
                                </Button>
                            </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                            نکته: اعداد، true/false، و JSON خودکار تشخیص داده می‌شوند
                        </div>
                    </CardWithIcon>

                    {/* Current Attributes */}
                    <CardWithIcon
                        icon={FileJson}
                        title="ویژگی‌های فعلی"
                        iconBgColor="bg-blue"
                        iconColor="stroke-blue-2"
                        borderColor="border-b-blue-1"
                    >
                        {Object.keys(currentAttributes).length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                                هیچ ویژگی اضافی ثبت نشده است
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {Object.entries(currentAttributes).map(([key, value]) => (
                                    <div
                                        key={key}
                                        className="flex items-start justify-between gap-4 p-3 bg-muted/50 rounded-md"
                                    >
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="font-mono">
                                                    {key}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    ({typeof value})
                                                </span>
                                            </div>
                                            <div className="text-sm font-mono text-muted-foreground break-all" dir="ltr">
                                                {typeof value === "object"
                                                    ? JSON.stringify(value, null, 2)
                                                    : String(value)}
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRemoveKey(key)}
                                            disabled={!editMode}
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardWithIcon>
                </>
            )}

            {/* Examples */}
            <CardWithIcon
                icon={FileJson}
                title="نمونه‌های کاربردی"
                iconBgColor="bg-yellow"
                iconColor="stroke-yellow-2"
                borderColor="border-b-yellow-1"
            >
                <div className="space-y-4 text-sm">
                    <div>
                        <div className="font-semibold mb-2">🏠 اجاره کوتاه‌مدت:</div>
                        <code className="block bg-muted p-3 rounded-md overflow-x-auto" dir="ltr">
                            {JSON.stringify(PRESETS.short_term_rental.data, null, 2)}
                        </code>
                    </div>
                    
                    <div>
                        <div className="font-semibold mb-2">🏗️ پیش‌فروش:</div>
                        <code className="block bg-muted p-3 rounded-md overflow-x-auto" dir="ltr">
                            {JSON.stringify(PRESETS.pre_sale.data, null, 2)}
                        </code>
                    </div>
                </div>
            </CardWithIcon>
        </div>
    );
}

export default ExtraAttributesTab;
