"use client";

import React from "react";
import { Button } from "@/components/elements/Button";
import { RefreshCw } from "lucide-react";
import ProtectedButton from "@/core/permissions/components/ProtectedButton";

interface TicketToolbarProps {
  onRefresh?: () => void;
}

export function TicketToolbar({
  onRefresh,
}: TicketToolbarProps) {
  return (
    <ProtectedButton 
      variant="outline" 
      size="icon" 
      onClick={onRefresh}
      permission="ticket.manage"
      showDenyToast={false}
    >
      <RefreshCw className="size-4" />
    </ProtectedButton>
  );
}

