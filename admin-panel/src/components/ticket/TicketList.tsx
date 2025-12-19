import React from "react";
import { TicketItem } from "./TicketItem";
import { Skeleton } from "@/components/elements/Skeleton";
import type { Ticket } from "@/types/ticket/ticket";

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
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="divide-y divide-border">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="p-4 space-y-3">
              <div className="flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
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

