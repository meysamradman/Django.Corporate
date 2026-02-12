import { Spinner } from '@/components/elements/Spinner';

export function MediaPlayerLoadingOverlay() {
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-40">
            <div className="flex flex-col items-center gap-4">
                <Spinner className="size-16 text-wt stroke-[1.5]" />
                <span className="text-sm text-wt font-bold tracking-tight opacity-90 drop-shadow-md">لطفاً کمی صبر کنید...</span>
            </div>
        </div>
    );
}