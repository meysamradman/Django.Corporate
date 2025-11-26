"use client";

import React from "react";
import { TicketItem } from "./TicketItem";
import { Ticket } from "@/types/ticket/ticket";

interface TicketListProps {
  tickets: Ticket[];
  selectedTickets: Set<number>;
  onSelectTicket: (ticketId: number) => void;
  onTicketClick?: (ticket: Ticket) => void;
  loading?: boolean;
}

export function TicketList({
  tickets,
  selectedTickets,
  onSelectTicket,
  onTicketClick,
  loading = false,
}: TicketListProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-font-s">در حال بارگذاری...</div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-font-s">تیکتی یافت نشد</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      <div className="divide-y divide-border">
        {tickets.map((ticket) => (
          <TicketItem
            key={ticket.id}
            ticket={ticket}
            isSelected={selectedTickets.has(ticket.id)}
            onSelect={onSelectTicket}
            onClick={onTicketClick}
          />
        ))}
      </div>
    </div>
  );
}

