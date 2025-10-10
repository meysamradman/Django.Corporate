import { EditAdminForm } from "./EditForm";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { adminApi } from "@/api/admins/route";
import { cookies } from 'next/headers';
import { createCookieHeader } from "@/components/shared/searchParamsUtils";

interface EditAdminPageProps {
  params: {
    id: string;
  };
}

export default async function EditAdminPage({ params }: EditAdminPageProps) {
  const { id } = await Promise.resolve(params);
  
  if (!id) {
    console.error("No valid ID in URL params");
    return notFound();
  }
  
  try {
    const adminId = id;
    
    
    const cookieStore = await cookies();
    const cookieHeader = createCookieHeader(cookieStore);

    const adminData = await adminApi.getAdminById(Number(adminId), { cookieHeader });
    
    if (!adminData) {
      console.error(`Edit Page SSR Error: Admin with ID ${adminId} not found or API call failed.`);
      return notFound();
    }

    return (
      <div className="space-y-6">
        {/* Header Section */}
                <div>
          <h1 className="page-title">ویرایش ادمین</h1>
        </div>

        {/* Main Content Card */}
        <Suspense fallback={<div className="p-6">در حال بارگذاری فرم...</div>}>
            <EditAdminForm adminData={adminData} />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error("Edit Page SSR Error loading admin data:", error);
    let errorMessage = "خطایی در بارگذاری اطلاعات ادمین برای ویرایش رخ داده است.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">ویرایش ادمین</h1>
        </div>

        <div className="text-center py-8">
          <p className="text-destructive">{errorMessage}</p>
          {process.env.NODE_ENV === 'development' && error instanceof Error && (
            <pre className="mt-2 text-sm text-red-500 text-left whitespace-pre-wrap bg-muted p-3 rounded">
              {JSON.stringify(error, null, 2)}
            </pre>
          )}
        </div>
      </div>
    );
  }
} 