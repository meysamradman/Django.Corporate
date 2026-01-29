import React from "react";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
} from "@/components/elements/Drawer";
import { Button } from "@/components/elements/Button";
import { Loader2, Save, X } from "lucide-react";

interface TaxonomySideFormProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
    isPending: boolean;
    isSubmitting: boolean;
    submitButtonText?: string;
    cancelButtonText?: string;
    formId: string;
    children: React.ReactNode;
}

/**
 * الگوی عمومی ایجاد تاکسونومی به صورت فرم کناری (Drawer)
 * مطابق تصویر ارسالی کاربر - باز شدن از سمت چپ با چیدمان RTL
 */
export const TaxonomySideForm: React.FC<TaxonomySideFormProps> = ({
    isOpen,
    onClose,
    title,
    description,
    onSubmit,
    isPending,
    isSubmitting,
    submitButtonText = "ایجاد",
    cancelButtonText = "انصراف",
    formId,
    children,
}) => {
    return (
        <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()} direction="left">
            <DrawerContent className="h-full sm:max-w-[600px] border-r bg-card flex flex-col focus:outline-none overflow-hidden text-right rtl">
                <DrawerHeader className="border-b px-6 py-5 flex-none relative">
                    <div className="flex flex-col gap-1 pr-0">
                        <DrawerTitle className="text-xl font-bold text-font-p">{title}</DrawerTitle>
                        {description && (
                            <DrawerDescription className="text-sm text-font-s">
                                {description}
                            </DrawerDescription>
                        )}
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={onClose}
                        className="absolute left-6 top-6 h-8 w-8 text-font-s rounded-full border-muted hover:bg-bg"
                        type="button"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </DrawerHeader>

                <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                    <form id={formId} onSubmit={onSubmit} noValidate>
                        {children}
                    </form>
                </div>

                <DrawerFooter className="border-t px-6 py-4 flex flex-row gap-3 flex-none bg-card">
                    <Button
                        type="submit"
                        form={formId}
                        className="flex-1 bg-primary text-static-w hover:bg-primary/90 shadow-md transition-all h-11"
                        disabled={isPending || isSubmitting}
                    >
                        {isPending || isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                در حال ایجاد...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 ml-2" />
                                {submitButtonText}
                            </>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-1 border-muted hover:bg-bg transition-colors h-11"
                        onClick={onClose}
                        disabled={isPending || isSubmitting}
                        type="button"
                    >
                        {cancelButtonText}
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
};
