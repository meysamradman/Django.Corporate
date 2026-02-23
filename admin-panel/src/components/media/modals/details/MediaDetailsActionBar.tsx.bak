import { Button } from '@/components/elements/Button';
import { Edit3, Save } from 'lucide-react';
import { ProtectedButton } from '@/core/permissions';

interface MediaDetailsActionBarProps {
    isEditing: boolean;
    isSaving: boolean;
    canUpdateMedia: boolean;
    showEditButton: boolean;
    updatePermission: string;
    onClose: () => void;
    onCancelEdit: () => void;
    onSaveEdit: () => void;
    onStartEdit: () => void;
}

export function MediaDetailsActionBar({
    isEditing,
    isSaving,
    canUpdateMedia,
    showEditButton,
    updatePermission,
    onClose,
    onCancelEdit,
    onSaveEdit,
    onStartEdit,
}: MediaDetailsActionBarProps) {
    return (
        <div className="bg-bg/50 border-t px-6 py-4">
            <div className="flex gap-3 justify-between">
                {isEditing ? (
                    <>
                        <Button
                            variant="outline"
                            onClick={onCancelEdit}
                            disabled={isSaving}
                        >
                            انصراف
                        </Button>
                        <ProtectedButton
                            permission={updatePermission}
                            onClick={onSaveEdit}
                            disabled={isSaving || !canUpdateMedia}
                            showDenyToast={true}
                            denyMessage="شما دسترسی ذخیره تغییرات این رسانه را ندارید"
                        >
                            {isSaving ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                                    در حال ذخیره...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 ml-2" />
                                    ذخیره
                                </>
                            )}
                        </ProtectedButton>
                    </>
                ) : (
                    <>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={onClose}>
                                بستن
                            </Button>
                        </div>
                        {showEditButton && (
                            <ProtectedButton
                                permission={updatePermission}
                                onClick={onStartEdit}
                                showDenyToast={true}
                                denyMessage="شما دسترسی ویرایش این رسانه را ندارید"
                            >
                                <Edit3 className="h-4 w-4 ml-2" />
                                ویرایش
                            </ProtectedButton>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}