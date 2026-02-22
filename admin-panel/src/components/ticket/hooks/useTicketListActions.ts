import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { showSuccess } from "@/core/toast";
import { getCrud } from "@/core/messages/ui";
import type { Ticket, ReplyTicketData } from "@/types/ticket/ticket";

interface UseTicketListActionsParams {
  refetch: () => void;
  selectedTicket: Ticket | null;
  setSelectedTicket: (ticket: Ticket | null) => void;
  replyToTicket: Ticket | null;
  setReplyToTicket: (ticket: Ticket | null) => void;
  setReplyOpen: (open: boolean) => void;
  deleteTicketById: (id: number) => Promise<unknown>;
  updateTicketStatusById: (id: number, status: Ticket["status"]) => Promise<unknown>;
  createTicketMessage: (payload: {
    ticket: number;
    message: string;
    sender_type: "admin";
    attachment_ids?: number[];
  }) => Promise<unknown>;
}

export function useTicketListActions({
  refetch,
  selectedTicket,
  setSelectedTicket,
  replyToTicket,
  setReplyToTicket,
  setReplyOpen,
  deleteTicketById,
  updateTicketStatusById,
  createTicketMessage,
}: UseTicketListActionsParams) {
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(() => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["ticket-stats"] });
    showSuccess(getCrud("updated", { item: "داده‌ها" }));
  }, [refetch, queryClient]);

  const handleDeleteTicket = useCallback(
    async (ticket: Ticket) => {
      try {
        await deleteTicketById(ticket.id);
        setSelectedTicket(null);
        refetch();
      } catch {
      }
    },
    [deleteTicketById, setSelectedTicket, refetch]
  );

  const handleStatusChangeForTicket = useCallback(
    async (ticket: Ticket, status: Ticket["status"]) => {
      try {
        await updateTicketStatusById(ticket.id, status);
        refetch();
        if (selectedTicket?.id === ticket.id) {
          setSelectedTicket({ ...selectedTicket, status });
        }
      } catch {
      }
    },
    [updateTicketStatusById, refetch, selectedTicket, setSelectedTicket]
  );

  const handleSendReply = useCallback(
    async (data: ReplyTicketData) => {
      if (!replyToTicket) return;

      try {
        await createTicketMessage({
          ticket: replyToTicket.id,
          message: data.message,
          sender_type: "admin",
          attachment_ids: data.attachment_ids,
        });
        setReplyToTicket(null);
        setReplyOpen(false);
        refetch();
        if (selectedTicket?.id === replyToTicket.id) {
          refetch();
        }
      } catch {
      }
    },
    [replyToTicket, createTicketMessage, setReplyToTicket, setReplyOpen, refetch, selectedTicket]
  );

  return {
    handleRefresh,
    handleDeleteTicket,
    handleStatusChangeForTicket,
    handleSendReply,
  };
}
