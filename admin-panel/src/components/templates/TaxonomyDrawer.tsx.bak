import React from "react";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from "@/components/elements/Drawer";
import { Button } from "@/components/elements/Button";
import { Loader2, Save, X } from "lucide-react";

interface TaxonomyDrawerProps {
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
 * الگوی عمومی مدیریت تاکسونومی (ایجاد/ویرایش) به صورت Drawer کناری
 * مطابق تصویر ارسالی کاربر - باز شدن از سمت چپ با چیدمان RTL
 */
export const TaxonomyDrawer: React.FC<TaxonomyDrawerProps> = ({
    isOpen,
    onClose,
    title,
    onSubmit,
    isPending,
    isSubmitting,
    submitButtonText = "ذخیره",
    cancelButtonText = "انصراف",
    formId,
    children,
}) => {
    return (
        <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()} direction="left">
            <DrawerContent className="fixed inset-y-5! left-5! z-50 flex w-full max-w-[460px] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl focus:outline-none text-right rtl">
                <DrawerHeader className="flex-none border-b border-muted/5">
                    <div className="flex items-center justify-between w-full">
                        <DrawerTitle className="text-base font-bold text-font-p tracking-tight leading-none">{title}</DrawerTitle>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={onClose}
                            className="h-8 w-8 text-font-s rounded-full border-muted/20 hover:bg-bg shadow-sm transition-all"
                            type="button"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DrawerHeader>

                <div className="flex-1 overflow-y-auto px-5 py-5 custom-scrollbar">
                    <form id={formId} onSubmit={onSubmit} noValidate className="space-y-8">
                        {children}
                    </form>
                </div>

                <div className="border-t border-muted/10 px-6 py-3 flex flex-row gap-3 flex-none bg-bg/50 backdrop-blur-md">
                    <Button
                        type="submit"
                        form={formId}
                        className="flex-2 bg-primary text-static-w hover:bg-primary/90 shadow-md transition-all h-10 text-xs font-bold rounded-xl"
                        disabled={isPending || isSubmitting}
                    >
                        {isPending || isSubmitting ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin me-2" />
                                در حال ارسال...
                            </>
                        ) : (
                            <>
                                <Save className="h-3.5 w-3.5 me-2" />
                                {submitButtonText}
                            </>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-1 border-muted/60 hover:bg-bg transition-colors h-10 text-[10px] font-bold rounded-xl"
                        onClick={onClose}
                        disabled={isPending || isSubmitting}
                        type="button"
                    >
                        {cancelButtonText}
                    </Button>
                </div>
            </DrawerContent>
        </Drawer>
    );
};
