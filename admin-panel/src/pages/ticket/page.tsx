import { useEffect, lazy } from "react";
import { useSearchParams } from "react-router-dom";
import { TicketSidebar, TicketList, TicketSearch, TicketToolbar } from "@/components/ticket";
import { Checkbox } from "@/components/elements/Checkbox";
import { useTicketList, useTicket, useTicketMessages, useCreateTicketMessage, useUpdateTicketStatus, useDeleteTicket, useMarkTicketAsRead } from "@/components/ticket/hooks/useTicket";
import { MessagingLayout } from "@/components/templates/MessagingLayout";
import { useTicketListState } from "@/components/ticket/hooks/useTicketListState";
import { useTicketListActions } from "@/components/ticket/hooks/useTicketListActions";
import { useTicketListDerived } from "@/components/ticket/hooks/useTicketListDerived";

const TicketDetailView = lazy(() => import("@/components/ticket").then(mod => ({ default: mod.TicketDetail })));
const ReplyTicketDialog = lazy(() => import("@/components/ticket/TicketReplyDialog.tsx").then(mod => ({ default: mod.TicketReplyDialog })));

export default function TicketPage() {
  const [searchParams] = useSearchParams();
  const ticketIdFromUrl = searchParams.get("ticketId");

  const {
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
  } = useTicketListState();

  const { data: ticketsData, isLoading, refetch } = useTicketList({
    page: 1,
    size: 50,
    search: searchQuery || undefined,
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
  });

  const { data: ticketDetail } = useTicket(selectedTicket?.id || null);
  const { data: ticketMessages } = useTicketMessages(selectedTicket?.id || null);
  const createMessage = useCreateTicketMessage();
  const updateStatus = useUpdateTicketStatus();
  const deleteTicket = useDeleteTicket();
  const markTicketAsRead = useMarkTicketAsRead();

  const tickets = ticketsData?.data || [];

  useEffect(() => {
    if (ticketIdFromUrl && tickets.length > 0) {
      const ticket = tickets.find((item) => item.id.toString() === ticketIdFromUrl);
      if (ticket) {
        setSelectedTicket(ticket);
        window.history.replaceState({}, "", "/ticket");
      }
    }
  }, [ticketIdFromUrl, tickets, setSelectedTicket]);

  const { filteredTickets, statusCounts } = useTicketListDerived({
    tickets,
    selectedStatus,
    searchQuery,
  });

  const { handleRefresh, handleDeleteTicket, handleStatusChangeForTicket, handleSendReply } = useTicketListActions({
    refetch,
    selectedTicket,
    setSelectedTicket,
    replyToTicket,
    setReplyToTicket,
    setReplyOpen,
    deleteTicketById: (id) => deleteTicket.mutateAsync(id),
    updateTicketStatusById: (id, status) => updateStatus.mutateAsync({ id, status }),
    createTicketMessage: (payload) => createMessage.mutateAsync(payload),
  });

  useEffect(() => {
    if (selectedTicket && selectedTicket.unread_messages_count && selectedTicket.unread_messages_count > 0) {
      const timer = setTimeout(() => {
        markTicketAsRead.mutate(selectedTicket.id);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [selectedTicket?.id, selectedTicket?.unread_messages_count]);

  return (
    <MessagingLayout
      sidebar={
        <TicketSidebar
          selectedStatus={selectedStatus}
          onStatusChange={handleStatusChange}
          statusCounts={statusCounts}
        />
      }
      toolbar={!selectedTicket && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Checkbox
              checked={
                filteredTickets.length > 0 && filteredTickets.every(t => selectedTickets.has(t.id))
                  ? true
                  : filteredTickets.some(t => selectedTickets.has(t.id))
                    ? "indeterminate"
                    : false
              }
              onCheckedChange={() => handleSelectAll(filteredTickets)}
              aria-label="انتخاب همه"
            />
            <TicketSearch value={searchQuery} onChange={setSearchQuery} />
          </div>
          <div className="flex items-center gap-2">
            <TicketToolbar onRefresh={handleRefresh} />
          </div>
        </div>
      )}
      dialogs={
        <ReplyTicketDialog
          open={replyOpen}
          onOpenChange={(open) => {
            setReplyOpen(open);
            if (!open) {
              setReplyToTicket(null);
            }
          }}
          onSend={handleSendReply}
          ticket={replyToTicket}
        />
      }
    >
      {selectedTicket ? (
        <TicketDetailView
          ticket={ticketDetail || selectedTicket}
          messages={ticketMessages}
          onReply={handleReplyTicket}
          onDelete={handleDeleteTicket}
          onStatusChange={handleStatusChangeForTicket}
        />
      ) : (
        <TicketList
          tickets={filteredTickets}
          selectedTickets={selectedTickets}
          onSelectTicket={handleSelectTicket}
          onTicketClick={handleTicketClick}
          loading={isLoading}
        />
      )}
    </MessagingLayout>
  );
}

