"use client";

import React from "react";
import { Button } from "@/components/elements/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/elements/DropdownMenu";
import {
  MoreVertical,
  RefreshCw,
  Mail,
  MailOpen,
} from "lucide-react";

interface EmailToolbarProps {
  selectedCount?: number;
  totalCount?: number;
  onSelectAll?: () => void;
  onRefresh?: () => void;
  onMarkAsRead?: () => void;
  onMarkAsUnread?: () => void;
}

export function EmailToolbar({
  onRefresh,
  onMarkAsRead,
  onMarkAsUnread,
}: EmailToolbarProps) {
  return (
    <>
      <Button variant="outline" size="icon" onClick={onRefresh}>
        <RefreshCw className="size-4" />
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onMarkAsRead}>
            <MailOpen className="size-4" />
            <span>خوانده شده</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onMarkAsUnread}>
            <Mail className="size-4" />
            <span>نخوانده شده</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

