import type { MapProviderProps } from "@/types/real_estate/map";

export default function GoogleMapProvider({
    latitude,
    longitude,
    apiKey,
}: MapProviderProps) {
    return (
        <div className="flex flex-col items-center justify-center h-full bg-muted/20 text-center p-8">
            <div className="p-4 rounded-full bg-blue/10 mb-4">
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/bd/Google_Maps_Logo_2020.svg" className="w-12 h-12" alt="Google Maps" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Google Maps Provider</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
                سرویس نقشه گوگل آماده پیاده‌سازی است. کلید API فعلی: {apiKey ? 'معتبر' : 'یافت نشد'}
            </p>
            {latitude && longitude && (
                <div className="mt-4 p-2 bg-bg rounded border text-xs">
                    موقعیت انتخاب شده: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </div>
            )}
        </div>
    );
}
