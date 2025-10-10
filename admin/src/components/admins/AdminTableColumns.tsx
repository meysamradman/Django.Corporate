"use client"

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/elements/Badge"
import { Checkbox } from "@/components/elements/Checkbox"
import { AdminWithProfile } from "@/types/auth/admin"
import { DataTableRowActions, type DataTableRowAction } from "@/components/tables/DataTableRowActions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/elements/Avatar";
import Link from "next/link";
import { mediaService } from "@/components/media/services";
import { formatDate } from "@/core/utils/format";

export const useAdminColumns = (
  rowActions: DataTableRowAction<AdminWithProfile>[]
): ColumnDef<AdminWithProfile>[] => {

  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="انتخاب همه"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="انتخاب ردیف"
        />
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
      header: () => "نام",
      cell: ({ row }) => {
        const admin = row.original;
        const profile = admin.profile;
        const fullName = admin.full_name || 
                         `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() ||
                         admin.email || 
                         admin.mobile || 
                         '';
        
        // Debug: Log profile and profile picture data
        console.log('Admin profile data:', {
          adminId: admin.id,
          profile: profile,
          profilePicture: profile?.profile_picture,
          profilePictureUrl: profile?.profile_picture?.url
        });
        
        const profilePictureUrl = profile?.profile_picture 
          ? mediaService.getMediaUrlFromObject(profile.profile_picture)
          : "";

        // Debug: Log the final URL
        console.log('Final profile picture URL:', profilePictureUrl);

        const getInitial = () => {
          const firstName = profile?.first_name || "";
          const lastName = profile?.last_name || "";
          if (!firstName && !lastName) return "؟";
          return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
        };

        return (
          <Link href={`/admins/${admin.id}/edit`} className="flex items-center gap-3 hover:underline">
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
          </Link>
        );
      },
      enableSorting: true,
      enableHiding: true,
      minSize: 200,
    },
    {
      accessorKey: "mobile",
      header: () => "موبایل",
      cell: ({ row }) => {
         const mobile = row.original.mobile;
         const admin = row.original;
         return (
           <Link href={`/admins/${admin.id}/edit`} className="table-cell-muted table-cell-medium hover:underline" dir="ltr">
             {mobile || "-"}
           </Link>
         );
      },
      enableSorting: false,
      enableHiding: true,
      minSize: 200,
    },
    {
      accessorKey: "email",
      header: () => "ایمیل",
      cell: ({ row }) => {
         const email = row.original.email;
         return (
           <span className="table-cell-muted table-cell-wide" dir="ltr">
             {email || "-"}
           </span>
         );
      },
      enableSorting: false,
      enableHiding: true,
      minSize: 200,
    },
    {
      accessorKey: "is_superuser",
      header: () => "نقش",
      cell: ({ row }) => {
        const admin = row.original;
        const isSuper = admin.is_superuser;
        const roles = admin.roles || [];
        
        // Super admin always shows as super admin
        if (isSuper) {
          return (
            <div className="table-badge-container">
              <Badge variant="default">سوپر ادمین</Badge>
            </div>
          );
        }
        
        // If has specific roles, show them
        if (roles.length > 0) {
          return (
            <div className="table-badge-container flex flex-wrap gap-1">
              {roles.map((role, index) => (
                <Badge key={index} variant="outline">
                  {role.name}
                </Badge>
              ))}
            </div>
          );
        }
        
        // Default admin role
        return (
          <div className="table-badge-container">
            <Badge variant="outline">ادمین عادی</Badge>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        const admin = row.original;
        const isSuper = admin.is_superuser;
        
        // Check if super admin matches filter (value = true)
        if (value.includes(true) && isSuper) {
          return true;
        }
        
        // Check if regular admin matches filter (value = false)
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
      header: () => "وضعیت",
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
      header: () => "تاریخ ایجاد",
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string;
        return (
          <div className="table-cell-muted">
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