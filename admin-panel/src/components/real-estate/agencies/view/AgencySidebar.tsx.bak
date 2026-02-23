import { Card, CardContent } from "@/components/elements/Card";
import { MediaImage } from "@/components/media/base/MediaImage";
import { mediaService } from "@/components/media/services";
import { TruncatedText } from "@/components/elements/TruncatedText";
import {
  Star,
  Hash,
  Link as LinkIcon,
  Clock,
  Building2,
  Phone,
  Zap,
} from "lucide-react";

interface AgencySidebarProps {
  agency: any;
}

export function AgencySidebar({ agency }: AgencySidebarProps) {
  const profilePictureUrl = agency.profile_picture?.file_url
    ? mediaService.getMediaUrlFromObject({ file_url: agency.profile_picture.file_url } as any)
    : null;

  const formatDate = (dateString: string) => {
    if (!dateString) return "نامشخص";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className="w-full space-y-6 sticky top-20 transition-all duration-300 ease-in-out self-start">
      <Card className="overflow-hidden">
        <CardContent className="pt-0 pb-0">
          <div className="pb-2">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border shadow-md">
              {profilePictureUrl ? (
                <MediaImage
                  media={{ file_url: profilePictureUrl } as any}
                  alt={agency.name}
                  className="object-cover"
                  fill
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-1 to-purple-2 flex items-center justify-center text-static-w text-5xl font-bold">
                  {agency.name?.[0]?.toUpperCase() || "A"}
                </div>
              )}
            </div>
          </div>

          <div className="pb-6 pt-2 border-b -mx-6 px-6">
            <div className="grid grid-cols-2 gap-3">
              <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${
                agency.is_active ? "bg-blue" : "bg-red"
              }`}>
                <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${
                  agency.is_active ? "bg-blue-0" : "bg-red-0"
                }`}>
                  <Zap className={`w-4 h-4 ${
                    agency.is_active ? "stroke-blue-2" : "stroke-red-2"
                  }`} />
                </div>
                <span className={`text-sm font-medium ${
                  agency.is_active ? "text-blue-2" : "text-red-2"
                }`}>
                  {agency.is_active ? "فعال" : "غیرفعال"}
                </span>
              </div>
              <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${
                agency.is_verified ? "bg-orange" : "bg-gray"
              }`}>
                <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${
                  agency.is_verified ? "bg-orange-0" : "bg-gray-0"
                }`}>
                  <Star className={`w-4 h-4 ${
                    agency.is_verified ? "stroke-orange-2 fill-orange-2" : "stroke-gray-1"
                  }`} />
                </div>
                <span className={`text-sm font-medium ${
                  agency.is_verified ? "text-orange-2" : "text-gray-1"
                }`}>
                  {agency.is_verified ? "تأیید شده" : "تأیید نشده"}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 pb-4">
            <div className="space-y-5">
            <div>
              <h4 className="mb-4 text-font-p">اطلاعات پایه</h4>
              <div className="space-y-0 [&>div:not(:last-child)]:border-b">
                <div className="flex items-center justify-between gap-3 pb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-font-s flex-shrink-0" />
                    <label>نام آژانس:</label>
                  </div>
                  <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                    <TruncatedText
                      text={agency.name}
                      maxLength={40}
                      className="text-font-p"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-font-s flex-shrink-0" />
                    <label>شناسه:</label>
                  </div>
                  <p className="text-font-p text-left">
                    #{agency.id}
                  </p>
                </div>

                {agency.phone && (
                  <div className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-font-s flex-shrink-0" />
                      <label>شماره تماس:</label>
                    </div>
                    <p className="text-font-p text-left">
                      {agency.phone}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-font-s flex-shrink-0" />
                    <label>نامک:</label>
                  </div>
                  <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                    <TruncatedText
                      text={agency.slug || "-"}
                      maxLength={35}
                      className="font-mono text-font-p"
                    />
                  </div>
                </div>

                {agency.created_at && (
                  <div className="flex items-center justify-between gap-3 pt-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-font-s flex-shrink-0" />
                      <label>تاریخ ایجاد:</label>
                    </div>
                    <p className="text-font-p text-left">
                      {formatDate(agency.created_at)}
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
