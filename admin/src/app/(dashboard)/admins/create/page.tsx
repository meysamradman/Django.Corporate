import { Suspense } from "react";
import { CreateAdminForm } from "./CreateForm";

export default function CreateAdminPage() {
    return (
        <Suspense fallback={
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center py-8">
                    <div className="flex gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-duration:0.6s]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s] [animation-duration:0.6s]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.6s] [animation-duration:0.6s]" />
                    </div>
                </div>
            </div>
        }>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                ایجاد ادمین جدید
                            </h1>
                        </div>
                    </div>
                </div>

                <CreateAdminForm />
            </div>
        </Suspense>
    );
}