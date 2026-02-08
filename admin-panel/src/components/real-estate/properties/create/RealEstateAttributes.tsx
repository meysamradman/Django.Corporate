import { useState, useEffect, useCallback } from "react";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { Settings, Plus, Building2, Compass, MapPin, Home, FileJson } from "lucide-react";
import { realEstateApi } from "@/api/real-estate";
import { showError } from "@/core/toast";
import { Skeleton } from "@/components/elements/Skeleton";
import { AttributeStandardFields } from "./attributes/AttributeStandardFields";
import { AttributeCustomTable } from "./attributes/AttributeCustomTable";
import { AttributeAddDialog } from "./attributes/AttributeAddDialog";

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

const PREDEFINED_FIELDS = [
    { key: 'property_condition', label: 'وضعیت ملک', icon: Building2 },
    { key: 'property_direction', label: 'جهت ملک', icon: Compass },
    { key: 'city_position', label: 'موقعیت در شهر', icon: MapPin },
    { key: 'unit_type', label: 'نوع واحد', icon: Home },
    { key: 'construction_status', label: 'وضعیت ساخت', icon: Building2 },
    { key: 'space_type', label: 'نوع کاربری', icon: Home },
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
                console.error("Fetch metadata error:", error);
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

    const handleAttributeChange = useCallback((key: string, value: any) => {
        if (!editMode) return;
        const newAttributes = { ...currentAttributes };

        if (value === "__none__" || value === "") {
            delete newAttributes[key];
        } else {
            newAttributes[key] = value;
        }

        handleInputChange("extra_attributes", newAttributes);
    }, [currentAttributes, editMode, handleInputChange]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <CardWithIcon
                    icon={Building2}
                    title="مشخصات تکمیلی (استاندارد)"
                    iconBgColor="bg-indigo-0"
                    iconColor="stroke-indigo-1"
                    cardBorderColor="border-b-indigo-1"
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
            <CardWithIcon
                icon={Building2}
                title="مشخصات تکمیلی (استاندارد)"
                iconBgColor="bg-indigo"
                iconColor="stroke-indigo-2"
                cardBorderColor="border-b-indigo-1"
                headerClassName="pb-3"
            >
                <AttributeStandardFields
                    fieldOptions={fieldOptions}
                    currentAttributes={currentAttributes}
                    handleAttributeChange={handleAttributeChange}
                    editMode={editMode}
                    predefinedFields={PREDEFINED_FIELDS}
                />
            </CardWithIcon>

            <CardWithIcon
                icon={FileJson}
                title="سایر اطلاعات و فیلدهای اضافی"
                iconBgColor="bg-purple"
                iconColor="stroke-purple-2"
                cardBorderColor="border-b-purple-1"
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
                    <AttributeCustomTable
                        customAttributes={customAttributes}
                        editMode={editMode}
                        handleAttributeChange={handleAttributeChange}
                        onEditKey={handleOpenDialog}
                        onDeleteClick={handleDeleteClick}
                    />
                )}
            </CardWithIcon>

            {editMode && (
                <AttributeAddDialog
                    dialogOpen={dialogOpen}
                    setDialogOpen={setDialogOpen}
                    editingKey={editingKey}
                    fieldKey={fieldKey}
                    setFieldKey={setFieldKey}
                    fieldValue={fieldValue}
                    setFieldValue={setFieldValue}
                    saving={saving}
                    handleCloseDialog={handleCloseDialog}
                    handleSave={handleSave}
                    deleteDialogOpen={deleteDialogOpen}
                    setDeleteDialogOpen={setDeleteDialogOpen}
                    keyToDelete={keyToDelete}
                    handleDelete={handleDelete}
                />
            )}
        </div>
    );
}

export default RealEstateAttributes;
