import { Card, CardContent } from "@/components/elements/Card";
import type { RealEstateAgency } from "@/types/real_estate/agency/realEstateAgency";
import {
  FileText,
  Zap,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface AgencyCreateSidebarProps {
  formData: Partial<RealEstateAgency>;
}

export function AgencyCreateSidebar({ formData }: AgencyCreateSidebarProps) {
  const isActive = formData.is_active ?? true;
  const isVerified = formData.is_verified ?? false;

  return (
    <div className="w-full space-y-6 sticky top-20 transition-all duration-300 ease-in-out self-start">
      <Card className="overflow-hidden">
        <CardContent className="pt-0 pb-0">
          <div className="pb-2">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border shadow-md">
              <div className="w-full h-full bg-gradient-to-br from-purple-1 to-purple-2 flex items-center justify-center text-static-w text-5xl font-bold">
                {formData.name?.[0]?.toUpperCase() || "A"}
              </div>
            </div>
          </div>

          <div className="pb-6 pt-2 border-b -mx-6 px-6">
            <div className="grid grid-cols-2 gap-3">
              <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${
                isActive ? "bg-blue" : "bg-red"
              }`}>
                <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${
                  isActive ? "bg-blue-0" : "bg-red-0"
                }`}>
                  <Zap className={`w-4 h-4 ${
                    isActive ? "stroke-blue-2" : "stroke-red-2"
                  }`} />
                </div>
                <span className={`text-sm font-medium ${
                  isActive ? "text-blue-2" : "text-red-2"
                }`}>
                  {isActive ? "فعال" : "غیرفعال"}
                </span>
              </div>
              <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${
                isVerified ? "bg-green" : "bg-gray"
              }`}>
                <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${
                  isVerified ? "bg-green-0" : "bg-gray-0"
                }`}>
                  {isVerified ? (
                    <CheckCircle2 className="w-4 h-4 stroke-green-2" />
                  ) : (
                    <XCircle className="w-4 h-4 stroke-gray-1" />
                  )}
                </div>
                <span className={`text-sm font-medium ${
                  isVerified ? "text-green-2" : "text-gray-1"
                }`}>
                  {isVerified ? "تأیید شده" : "تأیید نشده"}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 pb-4">
            <div className="space-y-5">
              <div>
                <h4 className="mb-4 text-font-p">اطلاعات پایه</h4>
                <div className="space-y-0 [&>div:not(:last-child)]:border-b">
                  {formData.name && (
                    <div className="flex items-center justify-between gap-3 pb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-font-s flex-shrink-0" />
                        <label>نام:</label>
                      </div>
                      <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                        <p className="text-font-p truncate">
                          {formData.name}
                        </p>
                      </div>
                    </div>
                  )}

                  {formData.phone && (
                    <div className="flex items-center justify-between gap-3 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-font-s flex-shrink-0" />
                        <label>تلفن:</label>
                      </div>
                      <p className="text-font-p text-left">
                        {formData.phone}
                      </p>
                    </div>
                  )}

                  {formData.email && (
                    <div className="flex items-center justify-between gap-3 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-font-s flex-shrink-0" />
                        <label>ایمیل:</label>
                      </div>
                      <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                        <p className="text-font-p truncate">
                          {formData.email}
                        </p>
                      </div>
                    </div>
                  )}

                  {formData.city && (
                    <div className="flex items-center justify-between gap-3 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-font-s flex-shrink-0" />
                        <label>شهر:</label>
                      </div>
                      <p className="text-font-p text-left">
                        {formData.city}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

