import { EditUserForm } from "./EditForm";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { adminApi } from "@/api/admins/route";
import { cookies } from 'next/headers';
import { createCookieHeader } from "@/components/shared/searchParamsUtils";

interface EditUserPageProps {
  params: {
    id: string;
  };
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const { id } = await Promise.resolve(params);
  
  if (!id) {
    console.error("No valid ID in URL params");
    return notFound();
  }
  
  try {
    const userId = id;
    
    
    const cookieStore = await cookies();
    const cookieHeader = createCookieHeader(cookieStore);

    const userData = await adminApi.getUserById(Number(userId), { cookieHeader });
    
    if (!userData) {
      console.error(`Edit Page SSR Error: User with ID ${userId} not found or API call failed.`);
      return notFound();
    }

    return (
      <div className="space-y-6">
        {/* Header Section */}
        <div>
          <h1 className="page-title">ویرایش کاربر</h1>
        </div>

        {/* Main Content Card */}
        <Suspense fallback={<div className="p-6">در حال بارگذاری فرم...</div>}>
            <EditUserForm userData={userData} />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error("Edit Page SSR Error loading user data:", error);
    let errorMessage = "خطایی در بارگذاری اطلاعات کاربر برای ویرایش رخ داده است.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">ویرایش کاربر</h1>
        </div>

        <div className="text-center py-8">
          <p className="text-destructive">{errorMessage}</p>
          {process.env.NODE_ENV === 'development' && error instanceof Error && (
            <pre className="mt-2 text-sm text-red-1 text-left whitespace-pre-wrap bg-bg p-3 rounded">
              {JSON.stringify(error, null, 2)}
            </pre>
          )}
        </div>
      </div>
    );
  }
}