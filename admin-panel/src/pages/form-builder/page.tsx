import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FormFieldsSection } from "@/components/form-builder/FormFieldsSection";
import { useGlobalDrawerStore } from "@/components/shared/drawer/store";
import { DRAWER_IDS } from "@/components/shared/drawer/types";

export default function FormSettingsPage() {
    const [searchParams] = useSearchParams();
    const openDrawer = useGlobalDrawerStore(state => state.open);

    useEffect(() => {
        const action = searchParams.get("action");
        const editId = searchParams.get("id") ? parseInt(searchParams.get("id")!) : null;

        if (action === "create-field") {
            openDrawer(DRAWER_IDS.FORM_BUILDER_FIELD_FORM);
        } else if (action === "edit-field" && editId) {
            openDrawer(DRAWER_IDS.FORM_BUILDER_FIELD_FORM, { editId });
        }
    }, [searchParams, openDrawer]);

    return (
        <div className="space-y-6">
            <FormFieldsSection />
        </div>
    );
}
