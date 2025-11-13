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

  const item = row.original

  // Filter actions based on condition
  const availableActions = actions.filter(
    (action) => !action.condition || action.condition(item)
  );

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
              action.onClick(item)
            }}
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