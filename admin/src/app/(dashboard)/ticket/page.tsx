"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { TicketSidebar, TicketList, TicketSearch, TicketToolbar, TicketDetailView, type ReplyTicketData } from "@/components/ticket";
import { ReplyTicketDialog } from "@/components/ticket/ReplyTicketDialog";
import { Checkbox } from "@/components/elements/Checkbox";
import { useTicketList, useTicket, useTicketMessages, useCreateTicketMessage, useUpdateTicketStatus, useDeleteTicket, useMarkTicketAsRead } from "@/core/hooks/useTicket";
import { Ticket, TicketStatusType, TicketMessage } from "@/types/ticket/ticket";
import { toast } from "@/components/elements/Sonner";

export default function TicketPage() {
  const searchParams = useSearchParams();
  const ticketIdFromUrl = searchParams?.get('ticketId');
  const queryClient = useQueryClient();
  
  const [selectedStatus, setSelectedStatus] = useState<TicketStatusType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTickets, setSelectedTickets] = useState<Set<number>>(new Set());
  const [replyOpen, setReplyOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyToTicket, setReplyToTicket] = useState<Ticket | null>(null);

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

  const handleRefresh = useCallback(() => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });
    toast.success('داده‌ها به‌روزرسانی شدند');
  }, [refetch, queryClient]);

  useEffect(() => {
    if (selectedTicket && selectedTicket.unread_messages_count && selectedTicket.unread_messages_count > 0) {
      const timer = setTimeout(() => {
        markTicketAsRead.mutate(selectedTicket.id);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [selectedTicket?.id, selectedTicket?.unread_messages_count]);

  useEffect(() => {
    if (ticketIdFromUrl && tickets.length > 0) {
      const ticket = tickets.find(t => t.id.toString() === ticketIdFromUrl);
      if (ticket) {
        setSelectedTicket(ticket);
        window.history.replaceState({}, '', '/ticket');
      }
    }
  }, [ticketIdFromUrl, tickets]);

  const handleStatusChange = useCallback((status: TicketStatusType | 'all') => {
    setSelectedStatus(status);
    setSelectedTickets(new Set());
    setSelectedTicket(null);
  }, []);

  const handleSelectTicket = useCallback((ticketId: number) => {
    setSelectedTickets(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(ticketId)) {
        newSelected.delete(ticketId);
      } else {
        newSelected.add(ticketId);
      }
      return newSelected;
    });
  }, []);

  const handleSelectAll = useCallback((filteredTickets: Ticket[]) => {
    setSelectedTickets(prev => {
      const filteredIds = new Set(filteredTickets.map((t) => t.id));
      const allSelected = filteredTickets.length > 0 && filteredTickets.every(t => prev.has(t.id));
      if (allSelected) {
        return new Set([...prev].filter(id => !filteredIds.has(id)));
      }
      return new Set([...prev, ...filteredTickets.map(t => t.id)]);
    });
  }, []);

  const handleTicketClick = useCallback((ticket: Ticket) => {
    setSelectedTicket(ticket);
  }, []);

  const handleReplyTicket = useCallback((ticket: Ticket) => {
    setReplyToTicket(ticket);
    setReplyOpen(true);
  }, []);

  const handleDeleteTicket = useCallback(async (ticket: Ticket) => {
    try {
      await deleteTicket.mutateAsync(ticket.id);
      setSelectedTicket(null);
      refetch();
    } catch (error) {
    }
  }, [deleteTicket, refetch]);

  const handleStatusChangeForTicket = useCallback(async (ticket: Ticket, status: Ticket['status']) => {
    try {
      await updateStatus.mutateAsync({ id: ticket.id, status });
      refetch();
      if (selectedTicket?.id === ticket.id) {
        setSelectedTicket({ ...selectedTicket, status });
      }
    } catch (error) {
    }
  }, [updateStatus, refetch, selectedTicket]);

  const handleSendReply = useCallback(async (data: ReplyTicketData) => {
    if (!replyToTicket) return;
    
    try {
      await createMessage.mutateAsync({
        ticket: replyToTicket.id,
        message: data.message,
        sender_type: 'admin',
        attachment_ids: data.attachment_ids,
      });
      setReplyToTicket(null);
      setReplyOpen(false);
      refetch();
      if (selectedTicket?.id === replyToTicket.id) {
        refetch();
      }
    } catch (error) {
    }
  }, [replyToTicket, createMessage, refetch, selectedTicket]);



  const filteredTickets = useMemo(() => {
    let filtered = tickets;
    
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(t => t.status === selectedStatus);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.subject.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.user?.full_name?.toLowerCase().includes(query) ||
        t.user?.email?.toLowerCase().includes(query) ||
        t.user?.mobile?.includes(query)
      );
    }
    
    return filtered;
  }, [tickets, selectedStatus, searchQuery]);

  const statusCounts = useMemo(() => {
    return {
      all: tickets.length,
      all_unread: tickets.filter(t => t.unread_messages_count && t.unread_messages_count > 0).length,
      open: tickets.filter(t => t.status === 'open').length,
      open_unread: tickets.filter(t => t.status === 'open' && t.unread_messages_count && t.unread_messages_count > 0).length,
      in_progress: tickets.filter(t => t.status === 'in_progress').length,
      in_progress_unread: tickets.filter(t => t.status === 'in_progress' && t.unread_messages_count && t.unread_messages_count > 0).length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      resolved_unread: tickets.filter(t => t.status === 'resolved' && t.unread_messages_count && t.unread_messages_count > 0).length,
      closed: tickets.filter(t => t.status === 'closed').length,
      closed_unread: tickets.filter(t => t.status === 'closed' && t.unread_messages_count && t.unread_messages_count > 0).length,
    };
  }, [tickets]);

  return (
    <div className="flex h-[calc(100vh-4rem-4rem)] bg-card overflow-hidden rounded-lg border shadow-[rgb(0_0_0/2%)_0px_6px_24px_0px,rgb(0_0_0/2%)_0px_0px_0px_1px]">
      <div className="w-64 flex-shrink-0 h-full overflow-hidden bg-card">
        <TicketSidebar
          selectedStatus={selectedStatus}
          onStatusChange={handleStatusChange}
          statusCounts={statusCounts}
        />
      </div>

      <div className="w-[1px] h-full bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {selectedTicket ? (
          <TicketDetailView
            ticket={ticketDetail || selectedTicket}
            messages={ticketMessages}
            onReply={handleReplyTicket}
            onDelete={handleDeleteTicket}
            onStatusChange={handleStatusChangeForTicket}
          />
        ) : (
          <>
            <div className="border-b p-4 flex-shrink-0">
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
            </div>

            <TicketList
              tickets={filteredTickets}
              selectedTickets={selectedTickets}
              onSelectTicket={handleSelectTicket}
              onTicketClick={handleTicketClick}
              loading={isLoading}
            />
          </>
        )}
      </div>

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
    </div>
  );
}

