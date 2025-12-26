import type { ReactNode } from "react";
import { Tabs } from "@/components/elements/Tabs";
import FormSaveBar from "@/components/elements/FormSaveBar";

interface AdminTabsFormWrapperProps {
  activeTab: string;
  onTabChange: (val: string) => void;
  tabs: ReactNode;
  children?: ReactNode;
  saveBar?: {
    onSave?: () => void;
    isSaving?: boolean;
    showCancel?: boolean;
    onCancel?: () => void;
    leftChildren?: ReactNode;
  };
  className?: string;
}

export function AdminTabsFormWrapper({
  activeTab,
  onTabChange,
  tabs,
  children,
  saveBar,
  className = "",
}: AdminTabsFormWrapperProps) {
  return (
    <div className={`space-y-6 pb-28 relative ${className}`}>
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        {tabs}
      </Tabs>

      <div>
        {children}
      </div>

      {saveBar && (
        <FormSaveBar
          onSave={saveBar.onSave}
          isSaving={saveBar.isSaving}
          showCancel={saveBar.showCancel}
          onCancel={saveBar.onCancel}
        >
          {saveBar.leftChildren}
        </FormSaveBar>
      )}
    </div>
  );
}

export default AdminTabsFormWrapper;


