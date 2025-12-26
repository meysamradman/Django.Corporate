import React from "react";
import { Button } from "@/components/elements/Button";

interface FormSaveBarProps {
  onSave?: () => void;
  isSaving?: boolean;
  saveLabel?: string;
  onCancel?: () => void;
  cancelLabel?: string;
  showCancel?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

export function FormSaveBar({
  onSave,
  isSaving = false,
  saveLabel = "ذخیره",
  onCancel,
  cancelLabel = "انصراف",
  showCancel = false,
  disabled = false,
  children,
}: FormSaveBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 lg:right-[20rem] z-50 border-t border-br bg-card shadow-lg transition-all duration-300 flex items-center justify-end gap-3 py-4 px-4 lg:px-8">
      <div className="flex-1 hidden lg:flex items-center">
        {children}
      </div>
      <div className="flex items-center gap-3">
        {showCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={disabled}>
            {cancelLabel}
          </Button>
        )}

        <Button onClick={onSave} size="lg" disabled={disabled || isSaving}>
          {isSaving ? (
            <>
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a12 12 0 100 24v-4l-3 3 3 3v-4a8 8 0 01-8-8z"></path>
              </svg>
              در حال ذخیره...
            </>
          ) : (
            <>
              {saveLabel}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default FormSaveBar;


