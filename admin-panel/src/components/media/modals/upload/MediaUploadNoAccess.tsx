export function MediaUploadNoAccess() {
    return (
        <div className="px-6 py-12 text-center space-y-3">
            <p className="text-font-p font-medium text-lg">دسترسی آپلود برای شما فعال نیست</p>
            <p className="text-font-s text-sm">
                برای بارگذاری رسانه باید مجوز مدیریت رسانه‌ها را داشته باشید. برای دریافت دسترسی با مدیر سیستم تماس بگیرید.
            </p>
        </div>
    );
}