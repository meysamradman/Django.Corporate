import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/elements/Badge"
import { Checkbox } from "@/components/elements/Checkbox"
import type { AdminWithProfile } from "@/types/auth/admin"
import { DataTableRowActions } from "@/components/tables/DataTableRowActions";
import type { DataTableRowAction } from "@/types/shared/table";
import { ProtectedLink } from "@/components/admins/permissions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/elements/Avatar";
import { mediaService } from "@/components/media/services";
import { formatDate } from "@/core/utils/format";
import { getPermissionTranslation } from "@/core/messages/permissions";

export const useAdminColumns = (
  rowActions: DataTableRowAction<AdminWithProfile>[]
): ColumnDef<AdminWithProfile>[] => {

  return [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="انتخاب همه"
        />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="انتخاب ردیف"
        />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 60,
      minSize: 60,
      maxSize: 60,
    },
    {
      accessorKey: "profile.full_name",
      id: "profile.full_name",
      header: () => <div className="table-header-text">نام</div>,
      cell: ({ row }) => {
        const admin = row.original;
        const profile = admin.profile;
        const fullName = admin.full_name || 
                         `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() ||
                         admin.email || 
                         admin.mobile || 
                         '';
        
        const profilePictureUrl = profile?.profile_picture 
          ? mediaService.getMediaUrlFromObject(profile.profile_picture)
          : "";

        const getInitial = () => {
          const firstName = profile?.first_name || "";
          const lastName = profile?.last_name || "";
          if (!firstName && !lastName) return "؟";
          return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
        };

        return (
          <ProtectedLink 
            to={`/admins/${admin.id}/edit`} 
            permission="admin.update"
            className="flex items-center gap-3"
          >
            <Avatar className="table-avatar">
              {profilePictureUrl ? (
                <AvatarImage src={profilePictureUrl} alt={fullName} />
              ) : (
                <AvatarFallback className="table-cell-avatar-fallback">
                  {getInitial()}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="table-cell-primary table-cell-wide">
              {fullName}
            </div>
          </ProtectedLink>
        );
      },
      enableSorting: true,
      enableHiding: true,
      minSize: 200,
    },
    {
      accessorKey: "mobile",
      header: () => <div className="table-header-text">موبایل</div>,
      cell: ({ row }) => {
         const mobile = row.original.mobile;
         return (
           <div className="table-cell-muted table-cell-wide" dir="ltr">
             {mobile || "-"}
           </div>
         );
      },
      enableSorting: false,
      enableHiding: true,
      minSize: 200,
    },
    {
      accessorKey: "email",
      header: () => <div className="table-header-text">ایمیل</div>,
      cell: ({ row }) => {
         const email = row.original.email;
         return (
           <div className="table-cell-muted table-cell-wide" dir="ltr">
             {email || "-"}
           </div>
         );
      },
      enableSorting: false,
      enableHiding: true,
      minSize: 200,
    },
    {
      accessorKey: "roles",
      header: () => <div className="table-header-text">نقش‌ها</div>,
      cell: ({ row }) => {
        const admin = row.original;
        const isSuper = admin.is_superuser;
        const roles = admin.roles || [];
        
        if (isSuper) {
          return (
            <div className="table-badge-container">
              <Badge variant="default">{getPermissionTranslation('super_admin', 'role')}</Badge>
            </div>
          );
        }
        
        if (roles.length > 0) {
          return (
            <div className="table-badge-container flex flex-wrap gap-1">
              {roles.map((role: any, index) => (
                <Badge key={index} variant="outline">
                  {typeof role === 'string' ? getPermissionTranslation(role, 'role') : 
                   role.name ? getPermissionTranslation(role.name, 'role') : 
                   role.display_name || 'نقش نامشخص'}
                </Badge>
              ))}
            </div>
          );
        }
        
        return (
          <div className="table-badge-container">
            <Badge variant="outline">ادمین عادی</Badge>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: true,
      minSize: 200,
    },
    {
      accessorKey: "is_superuser",
      header: () => <div className="table-header-text">نوع ادمین</div>,
      cell: ({ row }) => {
        const admin = row.original;
        const isSuper = admin.is_superuser;
        
        if (isSuper) {
          return (
            <div className="table-badge-container">
              <Badge variant="default">سوپر ادمین</Badge>
            </div>
          );
        }
        
        return (
          <div className="table-badge-container">
            <Badge variant="outline">ادمین عادی</Badge>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        const admin = row.original;
        const isSuper = admin.is_superuser;
        
        if (value.includes(true) && isSuper) {
          return true;
        }
        
        if (value.includes(false) && !isSuper) {
          return true;
        }
        
        return false;
      },
      enableSorting: true,
      enableHiding: true,
      minSize: 200,
    },
    {
      accessorKey: "is_active",
      header: () => <div className="table-header-text">وضعیت</div>,
      cell: ({ row }) => {
        const isActive = row.getValue("is_active");
        return (
          <div className="table-badge-container">
            {isActive ? (
              <Badge variant="green">فعال</Badge>
            ) : (
              <Badge variant="red">غیرفعال</Badge>
            )}
          </div>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(String(row.getValue(id)))
      },
      enableSorting: true,
      enableHiding: true,
      minSize: 200,
    },
    {
      accessorKey: "created_at",
      header: () => <div className="table-header-text">تاریخ ایجاد</div>,
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string;
        return (
          <div className="table-date-cell">
            {formatDate(date)}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
      minSize: 200,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return <DataTableRowActions row={row} actions={rowActions} />;
      },
      enableSorting: false,
      enableHiding: false,
      size: 60,
      minSize: 60,
      maxSize: 60,
    },
  ];
}; 