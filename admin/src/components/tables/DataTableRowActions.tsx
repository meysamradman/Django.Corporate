"use client"
import React from "react";
import { MoreVertical } from "lucide-react"
import { Row } from "@tanstack/react-table"
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

/**
 * 🔥 Optimized Row Actions with Permission Support
 * 
 * Strategy:
 * - Main buttons (Create, Delete All): Use ProtectedButton with toast
 * - Row actions (Edit, Delete): Disable silently (no toast) based on permission
 */
export function DataTableRowActions<TData>({
  row,
  actions,
}: DataTableRowActionsProps<TData>) {
  const { hasPermission, hasAllPermissions, hasAnyPermission } = usePermission();
  const item = row.original

  // Filter conditions and check permissions for actions (optimized: check once)
  // Strategy: 
  // - If user can see the list (read permission), show all actions but disable ones without permission
  // - Only filter out actions based on condition, not permission
  const availableActions = actions
    .filter((action) => {
      // Filter based on condition only (not permission)
      // Permission will disable the action, not hide it
      return !action.condition || action.condition(item);
    })
    .map((action) => {
      // Check permission if provided (only once)
      let isDisabled = false;
      
      // Check permission-based disable
      if (action.permission) {
        const permissions = Array.isArray(action.permission) ? action.permission : [action.permission];
        const hasAccess = action.requireAllPermissions
          ? hasAllPermissions(permissions)
          : permissions.length === 1
            ? hasPermission(permissions[0])
            : hasAnyPermission(permissions);
        // Disable if no permission (don't hide, just disable - no toast)
        isDisabled = !hasAccess;
      }
      
      // Check custom isDisabled function (item-specific logic)
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
              // Prevent action if disabled
              if (!action.isDisabled) {
                action.onClick(item);
              }
            }}
            disabled={action.isDisabled}
            className={action.isDestructive ? "text-destructive" : ""}
          >
            {action.icon && action.icon}
            {typeof action.label === 'function' ? action.label(item) : action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 