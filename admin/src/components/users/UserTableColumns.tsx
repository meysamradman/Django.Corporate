"use client"

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/elements/Badge"
import { Checkbox } from "@/components/elements/Checkbox"
import { UserWithProfile } from "@/types/auth/user"
import { DataTableRowActions, type DataTableRowAction } from "@/components/tables/DataTableRowActions"
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/elements/Avatar";
import { mediaService } from "@/components/media/services";
import { formatDate } from "@/core/utils/format";

export const useUserColumns = (
  rowActions: DataTableRowAction<UserWithProfile>[]
): ColumnDef<UserWithProfile>[] => {

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
        const user = row.original;
        const profile = user.profile;
        const fullName = profile?.full_name || 
                         `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() ||
                         user.email || 
                         user.mobile || 
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
          <Link href={`/users/${user.id}/edit`} className="flex items-center gap-3 hover:underline">
            <Avatar className="table-avatar">
              {profilePictureUrl ? (
                <AvatarImage src={profilePictureUrl} alt={fullName} />
              ) : (
                <AvatarFallback className="table-avatar-fallback">
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
         return (
           <span className="table-cell-muted table-cell-medium" dir="ltr">
             {mobile || "-"}
           </span>
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
          <span className="table-cell-muted table-cell-medium" dir="ltr">
            {email || "-"}
          </span>
        );
      },
      enableSorting: true,
      enableHiding: true,
      minSize: 200,
    },
    {
      accessorKey: "is_active",
      header: () => "وضعیت",
      cell: ({ row }) => {
        const isActive = row.original.is_active;
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
      header: () => "تاریخ عضویت",
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
