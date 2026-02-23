import React from "react";
import PropertyRequestFormClient from "@/components/property-request/PropertyRequestFormClient";

export default function PropertyRequestPage() {
  return (
    <div className="container mr-auto ml-auto py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-black">درخواست ملک</h1>
        <p className="mt-2 text-sm text-font-s">
          نیاز خود را ثبت کنید تا مناسب‌ترین فایل‌ها برای شما بررسی و معرفی شوند.
        </p>
      </div>

      <div className="max-w-3xl">
        <PropertyRequestFormClient />
      </div>
    </div>
  );
}
