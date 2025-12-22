import { Avatar, AvatarFallback, AvatarImage } from "@/components/elements/Avatar";
import { Card, CardContent } from "@/components/elements/Card";
import { mediaService } from "@/components/media/services";
import { formatDate } from "@/core/utils/format";
import type { AdminWithProfile } from "@/types/auth/admin";
import { MoreVertical, Mail, Phone } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/elements/DropdownMenu";
import type { DataTableRowAction } from "@/types/shared/table";
import { cn } from "@/core/utils/cn";
import { getPermissionTranslation } from "@/core/messages/permissions";

interface AdminCardProps {
  admin: AdminWithProfile;
  actions: DataTableRowAction<AdminWithProfile>[];
}

export function AdminCard({ admin, actions }: AdminCardProps) {
  const profile = admin.profile;
  const fullName = admin.full_name || 
                   `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() ||
                   admin.email || 
                   admin.mobile || 
                   '';
  const profilePictureUrl = profile?.profile_picture 
    ? mediaService.getMediaUrlFromObject(profile.profile_picture)
    : null;
  const firstName = profile?.first_name || "";
  const lastName = profile?.last_name || "";
  const initial = (!firstName && !lastName) ? "؟" : `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  
  const isActive = admin.is_active;
  const statusLabel = isActive ? "فعال" : "مرخصی";
  const statusClasses = isActive 
    ? "bg-green-0 text-green-1" 
    : "bg-red-0 text-red-1";
  
  const position = profile?.position || "-";
  const createdDate = admin.created_at ? formatDate(admin.created_at) : "-";

  const getRoleDisplay = () => {
    if (admin.is_superuser) {
      return getPermissionTranslation('super_admin', 'role') || "سوپر ادمین";
    }
    const roles = admin.roles || [];
    if (roles.length > 0) {
      const roleNames = roles.map((role: any) => {
        if (typeof role === 'string') {
          return getPermissionTranslation(role, 'role') || role;
        }
        if (role.is_system_role) {
          return getPermissionTranslation(role.name, 'role') || role.display_name || role.name;
        }
        return role.display_name || role.name;
      });
      return roleNames.join(", ");
    }
    return null;
  };

  const roleDisplay = getRoleDisplay();
  const availableActions = actions.filter(action => !action.isDisabled || !action.isDisabled(admin));

  return (
    <Card className="bg-wt rounded-lg shadow-sm border-0">
      <CardContent className="px-6 pt-0 pb-0">
        <div className="pt-0">
          <div className="flex items-start justify-between mb-4">
            <span className={cn("px-2.5 py-1 rounded-md text-xs font-medium", statusClasses)}>
              {statusLabel}
            </span>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-center size-8 rounded-md bg-gray-0/30 hover:bg-gray-0/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary">
                  <MoreVertical className="size-4 text-font-s" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[160px]">
                {availableActions.map((action, index) => {
                  const labelText = typeof action.label === 'function' ? action.label(admin) : action.label;
                  return (
                    <DropdownMenuItem
                      key={index}
                      onClick={() => action.onClick(admin)}
                      className={cn(action.isDestructive && "text-red-1 focus:text-red-1")}
                    >
                      {action.icon && <span className="ml-2">{action.icon}</span>}
                      {labelText}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex flex-col items-center mb-4">
            <Avatar className="size-20 rounded-xl mb-3">
              {profilePictureUrl ? (
                <AvatarImage src={profilePictureUrl} alt={fullName} className="rounded-xl" />
              ) : (
                <AvatarFallback className="bg-gray-0 text-font-p text-xl font-semibold rounded-xl">
                  {initial}
                </AvatarFallback>
              )}
            </Avatar>
            <h3 className="text-lg font-bold text-font-p">{fullName}</h3>
          </div>
        </div>
        <div className="bg-bg rounded-lg mb-0 p-4 flex flex-col justify-between min-h-[140px]">
          <div>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="text-right">
                <p className="text-xs text-font-s mb-1">نقش</p>
                <p className="text-sm font-medium text-font-p">{roleDisplay || "بدون نقش"}</p>
              </div>
              <div className="text-left">
                <p className="text-xs text-font-s mb-1">تاریخ استخدام</p>
                <p className="text-sm font-medium text-font-p">{createdDate}</p>
              </div>
            </div>
            
            <div className="border-t border-br mb-3" />
          </div>
          
          <div className="space-y-2">
            {admin.mobile ? (
              <div className="flex items-center gap-2 text-sm text-font-s">
                <Phone className="size-4 shrink-0" />
                <span dir="ltr">{admin.mobile}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-font-s">
                <Phone className="size-4 shrink-0" />
                <span>-</span>
              </div>
            )}
            {admin.email ? (
              <div className="flex items-center gap-2 text-sm text-font-s">
                <Mail className="size-4 shrink-0" />
                <span className="truncate" dir="ltr">{admin.email}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-font-s">
                <Mail className="size-4 shrink-0" />
                <span>-</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
