import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import type { Ticket, TicketStatusType } from "@/types/ticket/ticket";

export function useTicketListState() {
  const location = useLocation();

  const [selectedStatus, setSelectedStatus] = useState<TicketStatusType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTickets, setSelectedTickets] = useState<Set<number>>(new Set());
  const [replyOpen, setReplyOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyToTicket, setReplyToTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const statusParam = params.get("status") as TicketStatusType | null;
    if (statusParam && ["open", "in_progress", "resolved", "closed"].includes(statusParam)) {
      setSelectedStatus(statusParam);
    }
  }, [location.search]);

  const handleStatusChange = useCallback((status: TicketStatusType | "all") => {
    setSelectedStatus(status);
    setSelectedTickets(new Set());
    setSelectedTicket(null);
  }, []);

  const handleSelectTicket = useCallback((ticketId: number) => {
    setSelectedTickets((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(ticketId)) {
        newSelected.delete(ticketId);
      } else {
        newSelected.add(ticketId);
      }
      return newSelected;
    });
  }, []);

  const handleSelectAll = useCallback((list: Ticket[]) => {
    setSelectedTickets((prev) => {
      const filteredIds = new Set(list.map((item) => item.id));
      const allSelected = list.length > 0 && list.every((item) => prev.has(item.id));
      if (allSelected) {
        return new Set([...prev].filter((id) => !filteredIds.has(id)));
      }
      return new Set([...prev, ...list.map((item) => item.id)]);
    });
  }, []);

  const handleTicketClick = useCallback((ticket: Ticket) => {
    setSelectedTicket(ticket);
  }, []);

  const handleReplyTicket = useCallback((ticket: Ticket) => {
    setReplyToTicket(ticket);
    setReplyOpen(true);
  }, []);

  return {
    selectedStatus,
    searchQuery,
    setSearchQuery,
    selectedTickets,
    replyOpen,
    setReplyOpen,
    selectedTicket,
    setSelectedTicket,
    replyToTicket,
    setReplyToTicket,
    handleStatusChange,
    handleSelectTicket,
    handleSelectAll,
    handleTicketClick,
    handleReplyTicket,
  };
}
