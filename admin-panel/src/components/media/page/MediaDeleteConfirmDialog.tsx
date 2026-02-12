import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/elements/AlertDialog';

interface ConfirmDialogState {
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
}

interface MediaDeleteConfirmDialogProps {
    confirmDialog: ConfirmDialogState;
    onClose: () => void;
}

export function MediaDeleteConfirmDialog({ confirmDialog, onClose }: MediaDeleteConfirmDialogProps) {
    return (
        <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {confirmDialog.description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onClose}>
                        انصراف
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDialog.onConfirm} className="bg-destructive text-static-w hover:bg-destructive/90">
                        تأیید حذف
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}