import { useSearchParams } from "react-router-dom";
import { FormFieldsSection } from "@/components/form-builder/FormFieldsSection";
import { DRAWER_IDS } from "@/components/shared/drawer/types";
import { useOpenDrawerFromUrlAction } from "@/components/shared/drawer/useOpenDrawerFromUrlAction";

const FORM_BUILDER_DRAWER_ACTIONS = {
    "create-field": { drawerId: DRAWER_IDS.FORM_BUILDER_FIELD_FORM },
    "edit-field": { drawerId: DRAWER_IDS.FORM_BUILDER_FIELD_FORM, withEditId: true },
} as const;

export default function FormSettingsPage() {
    const [searchParams] = useSearchParams();

    useOpenDrawerFromUrlAction({ searchParams, actionMap: FORM_BUILDER_DRAWER_ACTIONS });

    return (
        <div className="space-y-6">
            <FormFieldsSection />
        </div>
    );
}
