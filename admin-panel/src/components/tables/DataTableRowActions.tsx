import React from "react";
import { MoreVertical } from "lucide-react"
import type { Row } from "@tanstack/react-table"
import { Button } from "@/components/elements/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/elements/DropdownMenu"
import { usePermission } from "@/core/permissions";
import type { DataTableRowAction } from "@/types/shared/table";

export type { DataTableRowAction };

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  actions: DataTableRowAction<TData>[]
}

export function DataTableRowActions<TData>({
  row,
  actions,
}: DataTableRowActionsProps<TData>) {
  const { hasPermission, hasAllPermissions, hasAnyPermission } = usePermission();
  const item = row.original

  const availableActions = actions
    .filter((action) => {
      return !action.condition || action.condition(item);
    })
    .map((action) => {
      let isDisabled = false;
      
      if (action.permission) {
        const permissions = Array.isArray(action.permission) ? action.permission : [action.permission];
        const hasAccess = action.requireAllPermissions
          ? hasAllPermissions(permissions)
          : permissions.length === 1
            ? hasPermission(permissions[0])
            : hasAnyPermission(permissions);
        isDisabled = !hasAccess;
      }
      
      if (!isDisabled && action.isDisabled) {
        isDisabled = action.isDisabled(item);
      }
      
      return { ...action, isDisabled };
    });

  if (availableActions.length === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-bg"
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">باز کردن منو</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[160px]">
        {availableActions.map((action, index) => (
          <DropdownMenuItem
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              if (!action.isDisabled) {
                action.onClick(item);
              }
            }}
            disabled={action.isDisabled}
            variant={action.isDestructive ? "destructive" : "default"}
          >
            {action.icon}
            {typeof action.label === 'function' ? action.label(item) : action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 