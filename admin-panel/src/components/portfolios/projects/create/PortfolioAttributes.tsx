import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { Settings, Plus } from "lucide-react";
import type { PortfolioFormValues } from "@/components/portfolios/validations/portfolioSchema";
import { showError } from "@/core/toast";
import { msg } from "@/core/messages";
import { PortfolioAttributesTable } from "./attributes/PortfolioAttributesTable";
import { PortfolioAttributesDialogs } from "./attributes/PortfolioAttributesDialogs";

interface ExtraAttributesTabProps {
    form?: UseFormReturn<PortfolioFormValues>;
    formData?: any;
    handleInputChange?: (field: string, value: any) => void;
    editMode: boolean;
}

export function PortfolioAttributes(props: ExtraAttributesTabProps) {
    const isFormApproach = 'form' in props;
    const form = isFormApproach ? props.form : null;
    const watch = isFormApproach ? form?.watch : null;
    const setValue = isFormApproach ? form?.setValue : null;
    const formData = isFormApproach ? null : props.formData;
    const handleInputChange = isFormApproach ? null : props.handleInputChange;
    const editMode = props.editMode;

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
            showError(msg.validation('required', { field: 'نام فیلد' }));
            return;
        }
        if (!editingKey && currentAttributes[fieldKey.trim()]) {
            showError(msg.validation('duplicateFieldName'));
            return;
        }
        setSaving(true);
        const newAttributes = { ...currentAttributes, [fieldKey.trim()]: fieldValue.trim() || null };
        if (editingKey && editingKey !== fieldKey.trim()) delete newAttributes[editingKey];
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
        const newAttributes = { ...currentAttributes, [key]: value };
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
                cardBorderColor="border-b-purple-1"
                headerClassName="pb-3"
                titleExtra={
                    editMode && Object.keys(currentAttributes).length > 0 && (
                        <Button onClick={() => handleOpenDialog()} size="sm" className="gap-2">
                            <Plus className="h-4 w-4" />
                            افزودن فیلد جدید
                        </Button>
                    )
                }
            >
                <PortfolioAttributesTable
                    currentAttributes={currentAttributes}
                    editMode={editMode}
                    onOpenDialog={handleOpenDialog}
                    onDeleteClick={handleDeleteClick}
                    onValueChange={handleValueChange}
                />
            </CardWithIcon>

            {editMode && (
                <PortfolioAttributesDialogs
                    dialogOpen={dialogOpen}
                    setDialogOpen={setDialogOpen}
                    editingKey={editingKey}
                    fieldKey={fieldKey}
                    setFieldKey={setFieldKey}
                    fieldValue={fieldValue}
                    setFieldValue={setFieldValue}
                    saving={saving}
                    handleSave={handleSave}
                    handleCloseDialog={handleCloseDialog}
                    deleteDialogOpen={deleteDialogOpen}
                    setDeleteDialogOpen={setDeleteDialogOpen}
                    handleDelete={handleDelete}
                />
            )}
        </>
    );
}

export default PortfolioAttributes;
