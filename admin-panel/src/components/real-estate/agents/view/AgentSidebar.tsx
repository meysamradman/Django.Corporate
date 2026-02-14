import { useState } from "react";
import { Card, CardContent } from "@/components/elements/Card";
import type { PropertyAgent } from "@/types/real_estate/agent/realEstateAgent";
import { MediaImage } from "@/components/media/base/MediaImage";
import { mediaService } from "@/components/media/services";
import { TruncatedText } from "@/components/elements/TruncatedText";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { Switch } from "@/components/elements/Switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate";
import { showSuccess, showError } from '@/core/toast';
import {
  CheckCircle2,
  XCircle,
  Hash,
  Link as LinkIcon,
  Clock,
  Zap,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Briefcase,
} from "lucide-react";

interface AgentSidebarProps {
  agent: PropertyAgent;
}

export function AgentSidebar({ agent }: AgentSidebarProps) {
  const queryClient = useQueryClient();
  const [isActive, setIsActive] = useState(agent.is_active ?? true);
  const [isVerified, setIsVerified] = useState(agent.is_verified ?? false);

  const profileImageUrl = agent.profile_image?.file_url
    ? mediaService.getMediaUrlFromObject({ file_url: agent.profile_image.file_url } as any)
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

  const updateActiveMutation = useMutation({
    mutationFn: async (checked: boolean) => {
      return await realEstateApi.partialUpdateAgent(agent.id, { is_active: checked });
    },
    onSuccess: (data) => {
      setIsActive(data.is_active ?? true);
      queryClient.invalidateQueries({ queryKey: ['agent', agent.id] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      showSuccess(`وضعیت فعال با موفقیت به ${data.is_active ? 'فعال' : 'غیرفعال'} تغییر یافت`);
    },
    onError: (error) => {
      setIsActive(!isActive);
      showError(error, { customMessage: "خطا در تغییر وضعیت فعال" });
    },
  });

  const updateVerifiedMutation = useMutation({
    mutationFn: async (checked: boolean) => {
      return await realEstateApi.partialUpdateAgent(agent.id, { is_verified: checked });
    },
    onSuccess: (data) => {
      setIsVerified(data.is_verified ?? false);
      queryClient.invalidateQueries({ queryKey: ['agent', agent.id] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      showSuccess(`وضعیت تأیید با موفقیت به ${data.is_verified ? 'تأیید شده' : 'تأیید نشده'} تغییر یافت`);
    },
    onError: (error) => {
      setIsVerified(!isVerified);
      showError(error, { customMessage: "خطا در تغییر وضعیت تأیید" });
    },
  });

  return (
    <div className="w-full space-y-6 sticky top-20 transition-all duration-300 ease-in-out self-start">
      <Card className="overflow-hidden">
        <CardContent className="pt-0 pb-0">
          <div className="pb-2">
            <div className="relative w-full aspect-square rounded-xl overflow-hidden border shadow-md">
              {profileImageUrl ? (
                <MediaImage
                  media={{ file_url: profileImageUrl } as any}
                  alt={`${agent.first_name} ${agent.last_name}`}
                  className="object-cover"
                  fill
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-1 to-purple-2 flex items-center justify-center text-static-w text-5xl font-bold">
                  {agent.first_name?.[0]?.toUpperCase() || agent.last_name?.[0]?.toUpperCase() || "A"}
                </div>
              )}
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
                <div className="flex items-center justify-between gap-3 pb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-font-s flex-shrink-0" />
                    <label>مشاور:</label>
                  </div>
                  <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                    <TruncatedText
                      text={`${agent.first_name} ${agent.last_name}`}
                      maxLength={40}
                      className="text-font-p"
                    />
                  </div>
                </div>

                {agent.agency && (
                  <div className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-font-s flex-shrink-0" />
                      <label>آژانس:</label>
                    </div>
                    <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                      <TruncatedText
                        text={agent.agency.name}
                        maxLength={35}
                        className="text-font-p"
                      />
                    </div>
                  </div>
                )}

                {agent.specialization && (
                  <div className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-font-s flex-shrink-0" />
                      <label>نوع:</label>
                    </div>
                    <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                      <TruncatedText
                        text={agent.specialization}
                        maxLength={35}
                        className="text-font-p"
                      />
                    </div>
                  </div>
                )}

                {agent.phone && (
                  <div className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-font-s flex-shrink-0" />
                      <label>تلفن:</label>
                    </div>
                    <p className="text-font-p text-left">
                      {agent.phone}
                    </p>
                  </div>
                )}

                {agent.email && (
                  <div className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-font-s flex-shrink-0" />
                      <label>ایمیل:</label>
                    </div>
                    <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                      <TruncatedText
                        text={agent.email}
                        maxLength={35}
                        className="text-font-p"
                      />
                    </div>
                  </div>
                )}

                {agent.city_name && (
                  <div className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-font-s flex-shrink-0" />
                      <label>شهر:</label>
                    </div>
                    <p className="text-font-p text-left">
                      {agent.city_name}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-font-s flex-shrink-0" />
                    <label>شناسه:</label>
                  </div>
                  <p className="text-font-p text-left">
                    #{agent.id}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-font-s flex-shrink-0" />
                    <label>نامک:</label>
                  </div>
                  <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                    <TruncatedText
                      text={agent.slug || "-"}
                      maxLength={35}
                      className="font-mono text-font-p"
                    />
                  </div>
                </div>

                {agent.created_at && (
                  <div className="flex items-center justify-between gap-3 pt-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-font-s flex-shrink-0" />
                      <label>تاریخ ایجاد:</label>
                    </div>
                    <p className="text-font-p text-left">
                      {formatDate(agent.created_at)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="mb-4 text-font-p">تنظیمات</h4>
              <div className="space-y-4">
                <div className="rounded-xl border border-green-1/40 bg-green-0/30 hover:border-green-1/60 transition-colors overflow-hidden">
                  <Item variant="default" size="default" className="py-5">
                    <ItemContent>
                      <ItemTitle className="text-green-2">وضعیت فعال</ItemTitle>
                      <ItemDescription>
                        با غیرفعال شدن، مشاور از لیست مدیریت نیز مخفی می‌شود.
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <Switch
                        checked={isActive}
                        disabled={updateActiveMutation.isPending}
                        onCheckedChange={(checked) => updateActiveMutation.mutate(checked)}
                      />
                    </ItemActions>
                  </Item>
                </div>
                
                <div className="rounded-xl border border-blue-1/40 bg-blue-0/30 hover:border-blue-1/60 transition-colors overflow-hidden">
                  <Item variant="default" size="default" className="py-5">
                    <ItemContent>
                      <ItemTitle className="text-blue-2">وضعیت تأیید</ItemTitle>
                      <ItemDescription>
                        مشاورین تأیید شده در سایت با نشان تأیید نمایش داده می‌شوند.
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <Switch
                        checked={isVerified}
                        disabled={updateVerifiedMutation.isPending}
                        onCheckedChange={(checked) => updateVerifiedMutation.mutate(checked)}
                      />
                    </ItemActions>
                  </Item>
                </div>
              </div>
            </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

