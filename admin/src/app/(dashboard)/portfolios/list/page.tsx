"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PortfolioListPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main portfolios page
    router.push("/portfolios");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-500">در حال انتقال به صفحه نمونه‌کارها...</p>
      </div>
    </div>
  );
}