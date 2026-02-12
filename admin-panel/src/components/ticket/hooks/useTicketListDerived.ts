import { useMemo } from "react";
import type { Ticket, TicketStatusType } from "@/types/ticket/ticket";

interface UseTicketListDerivedParams {
  tickets: Ticket[];
  selectedStatus: TicketStatusType | "all";
  searchQuery: string;
}

export function useTicketListDerived({ tickets, selectedStatus, searchQuery }: UseTicketListDerivedParams) {
  const filteredTickets = useMemo(() => {
    let filtered = tickets;

    if (selectedStatus !== "all") {
      filtered = filtered.filter((item) => item.status === selectedStatus);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.subject.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.user?.full_name?.toLowerCase().includes(query) ||
          item.user?.email?.toLowerCase().includes(query) ||
          item.user?.mobile?.includes(query)
      );
    }

    return filtered;
  }, [tickets, selectedStatus, searchQuery]);

  const statusCounts = useMemo(
    () => ({
      all: tickets.length,
      all_unread: tickets.filter((item) => item.unread_messages_count && item.unread_messages_count > 0).length,
      open: tickets.filter((item) => item.status === "open").length,
      open_unread: tickets.filter((item) => item.status === "open" && item.unread_messages_count && item.unread_messages_count > 0).length,
      in_progress: tickets.filter((item) => item.status === "in_progress").length,
      in_progress_unread: tickets.filter(
        (item) => item.status === "in_progress" && item.unread_messages_count && item.unread_messages_count > 0
      ).length,
      resolved: tickets.filter((item) => item.status === "resolved").length,
      resolved_unread: tickets.filter(
        (item) => item.status === "resolved" && item.unread_messages_count && item.unread_messages_count > 0
      ).length,
      closed: tickets.filter((item) => item.status === "closed").length,
      closed_unread: tickets.filter((item) => item.status === "closed" && item.unread_messages_count && item.unread_messages_count > 0).length,
    }),
    [tickets]
  );

  return {
    filteredTickets,
    statusCounts,
  };
}
