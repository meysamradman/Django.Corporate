"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { TicketSidebar, TicketList, TicketSearch, TicketToolbar, TicketDetailView, type ReplyTicketData, type CreateTicketData } from "@/components/ticket";
import { ReplyTicketDialog } from "@/components/ticket/ReplyTicketDialog";
import { CreateTicketDialog } from "@/components/ticket/CreateTicketDialog";
import { Checkbox } from "@/components/elements/Checkbox";
import { useTicketList, useTicket, useTicketMessages, useCreateTicketMessage, useCreateTicket, useUpdateTicketStatus, useDeleteTicket } from "@/core/hooks/useTicket";
import { Ticket, TicketStatusType, TicketMessage } from "@/types/ticket/ticket";
import { toast } from "@/components/elements/Sonner";

export default function TicketPage() {
  const [selectedStatus, setSelectedStatus] = useState<TicketStatusType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTickets, setSelectedTickets] = useState<Set<number>>(new Set());
  const [replyOpen, setReplyOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyToTicket, setReplyToTicket] = useState<Ticket | null>(null);
  const [mockTickets, setMockTickets] = useState<Ticket[]>([]);
  const [mockMessages, setMockMessages] = useState<Record<number, TicketMessage[]>>({});

  const { data: ticketsData, isLoading, refetch } = useTicketList({
    page: 1,
    size: 50,
    search: searchQuery || undefined,
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
  });

  const { data: ticketDetail } = useTicket(selectedTicket?.id || null);
  const { data: ticketMessages } = useTicketMessages(selectedTicket?.id || null);
  const createMessage = useCreateTicketMessage();
  const createTicket = useCreateTicket();
  const updateStatus = useUpdateTicketStatus();
  const deleteTicket = useDeleteTicket();

  const tickets = mockTickets.length > 0 ? mockTickets : (ticketsData?.data || []);

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
    if (mockTickets.length > 0) {
      setMockTickets(prev => prev.filter(t => t.id !== ticket.id));
      setMockMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[ticket.id];
        return newMessages;
      });
      setSelectedTicket(null);
      toast.success("تیکت با موفقیت حذف شد");
      return;
    }
    
    try {
      await deleteTicket.mutateAsync(ticket.id);
      setSelectedTicket(null);
      refetch();
    } catch (error) {
      // Error handled by hook
    }
  }, [deleteTicket, refetch, mockTickets]);

  const handleStatusChangeForTicket = useCallback(async (ticket: Ticket, status: Ticket['status']) => {
    if (mockTickets.length > 0) {
      setMockTickets(prev => prev.map(t => 
        t.id === ticket.id ? { ...t, status } : t
      ));
      if (selectedTicket?.id === ticket.id) {
        setSelectedTicket({ ...selectedTicket, status });
      }
      toast.success("وضعیت تیکت با موفقیت به‌روزرسانی شد");
      return;
    }
    
    try {
      await updateStatus.mutateAsync({ id: ticket.id, status });
      refetch();
      if (selectedTicket?.id === ticket.id) {
        setSelectedTicket({ ...selectedTicket, status });
      }
    } catch (error) {
      // Error handled by hook
    }
  }, [updateStatus, refetch, selectedTicket, mockTickets]);

  const handleCreateTicket = useCallback(async (data: CreateTicketData) => {
    if (mockTickets.length > 0) {
      const newTicket: Ticket = {
        id: Date.now(),
        public_id: `ticket-${Date.now()}`,
        subject: data.subject,
        description: data.description,
        status: 'open',
        priority: data.priority,
        user: {
          id: 1,
          mobile: "09123456789",
          email: "admin@example.com",
          full_name: "ادمین",
        },
        assigned_admin: null,
        last_replied_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
        messages_count: data.message ? 1 : 0,
        unread_messages_count: 0,
      };

      if (data.message) {
        const newMessage: TicketMessage = {
          id: Date.now() + 1,
          public_id: `msg-${Date.now() + 1}`,
          ticket: newTicket.id,
          message: data.message,
          sender_type: 'admin',
          sender_admin: {
            id: 1,
            user: {
              id: 1,
              username: 'admin',
              email: 'admin@example.com',
            },
          },
          is_read: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          attachments: [],
        };

        setMockMessages(prev => ({
          ...prev,
          [newTicket.id]: [newMessage],
        }));
      }

      setMockTickets(prev => [newTicket, ...prev]);
      setCreateOpen(false);
      toast.success("تیکت با موفقیت ایجاد شد");
      return;
    }

    try {
      await createTicket.mutateAsync(data);
      setCreateOpen(false);
      refetch();
    } catch (error) {
      // Error handled by hook
    }
  }, [createTicket, refetch, mockTickets]);

  const handleSendReply = useCallback(async (data: ReplyTicketData) => {
    if (!replyToTicket) return;
    
    if (mockTickets.length > 0) {
      const newMessage: TicketMessage = {
        id: Date.now(),
        public_id: `msg-${Date.now()}`,
        ticket: replyToTicket.id,
        message: data.message,
        sender_type: 'admin',
        sender_admin: {
          id: 1,
          user: {
            id: 1,
            username: 'admin',
            email: 'admin@example.com',
          },
        },
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        attachments: [],
      };
      
      setMockMessages(prev => ({
        ...prev,
        [replyToTicket.id]: [...(prev[replyToTicket.id] || []), newMessage],
      }));
      
      setMockTickets(prev => prev.map(t => 
        t.id === replyToTicket.id 
          ? { ...t, last_replied_at: new Date().toISOString(), messages_count: (t.messages_count || 0) + 1 }
          : t
      ));
      
      if (selectedTicket?.id === replyToTicket.id) {
        setSelectedTicket({
          ...selectedTicket,
          last_replied_at: new Date().toISOString(),
          messages_count: (selectedTicket.messages_count || 0) + 1,
        });
      }
      
      setReplyToTicket(null);
      setReplyOpen(false);
      toast.success("پیام با موفقیت ارسال شد");
      return;
    }
    
    try {
      await createMessage.mutateAsync({
        ticket: replyToTicket.id,
        message: data.message,
        sender_type: 'admin',
        attachment_ids: data.attachment_ids,
      });
      setReplyToTicket(null);
      refetch();
      if (selectedTicket?.id === replyToTicket.id) {
        refetch();
      }
    } catch (error) {
      // Error handled by hook
    }
  }, [replyToTicket, createMessage, refetch, selectedTicket, mockTickets]);

  useEffect(() => {
    if (true) {
      const mockTicketsData: Ticket[] = [
        {
          id: 1,
          public_id: "ticket-1",
          subject: "مشکل در ورود به سیستم",
          description: "سلام، من نمی‌توانم به حساب کاربری خود وارد شوم. پیام خطا می‌دهد که رمز عبور اشتباه است اما من مطمئنم که رمز درست است. لطفاً کمک کنید.\n\nاین یک متن طولانی است که برای تست اسکرول استفاده می‌شود. ما می‌خواهیم ببینیم که آیا صفحه به درستی اسکرول می‌شود یا نه.",
          status: "open",
          priority: "high",
          user: {
            id: 1,
            mobile: "09123456789",
            email: "ali@example.com",
            full_name: "علی احمدی",
          },
          assigned_admin: null,
          last_replied_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
          messages_count: 1,
          unread_messages_count: 1,
        },
        {
          id: 2,
          public_id: "ticket-2",
          subject: "درخواست تغییر اطلاعات پروفایل",
          description: "می‌خواهم اطلاعات پروفایلم را تغییر دهم اما گزینه ویرایش کار نمی‌کند.",
          status: "in_progress",
          priority: "medium",
          user: {
            id: 2,
            mobile: "09123456790",
            email: "mohammad@example.com",
            full_name: "محمد رضایی",
          },
          assigned_admin: {
            id: 1,
            user: {
              id: 1,
              username: "admin",
              email: "admin@example.com",
            },
          },
          last_replied_at: new Date(Date.now() - 3600000).toISOString(),
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 3600000).toISOString(),
          is_active: true,
          messages_count: 3,
          unread_messages_count: 0,
        },
        {
          id: 3,
          public_id: "ticket-3",
          subject: "سوال در مورد محصولات",
          description: "می‌خواهم اطلاعات بیشتری در مورد محصولات شما بدانم.",
          status: "resolved",
          priority: "low",
          user: {
            id: 3,
            mobile: "09123456791",
            email: "sara@example.com",
            full_name: "سارا کریمی",
          },
          assigned_admin: {
            id: 1,
            user: {
              id: 1,
              username: "admin",
              email: "admin@example.com",
            },
          },
          last_replied_at: new Date(Date.now() - 172800000).toISOString(),
          created_at: new Date(Date.now() - 172800000).toISOString(),
          updated_at: new Date(Date.now() - 172800000).toISOString(),
          is_active: true,
          messages_count: 5,
          unread_messages_count: 0,
        },
        {
          id: 4,
          public_id: "ticket-4",
          subject: "مشکل فنی در اپلیکیشن",
          description: "اپلیکیشن موبایل من crash می‌کند وقتی می‌خواهم عکس آپلود کنم.",
          status: "open",
          priority: "urgent",
          user: {
            id: 4,
            mobile: "09123456792",
            email: "reza@example.com",
            full_name: "رضا محمودی",
          },
          assigned_admin: null,
          last_replied_at: null,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          updated_at: new Date(Date.now() - 7200000).toISOString(),
          is_active: true,
          messages_count: 1,
          unread_messages_count: 1,
        },
        {
          id: 5,
          public_id: "ticket-5",
          subject: "درخواست بازگشت وجه",
          description: "می‌خواهم برای خرید اخیرم درخواست بازگشت وجه بدهم.",
          status: "closed",
          priority: "medium",
          user: {
            id: 5,
            mobile: "09123456793",
            email: "fateme@example.com",
            full_name: "فاطمه نوری",
          },
          assigned_admin: {
            id: 1,
            user: {
              id: 1,
              username: "admin",
              email: "admin@example.com",
            },
          },
          last_replied_at: new Date(Date.now() - 259200000).toISOString(),
          created_at: new Date(Date.now() - 259200000).toISOString(),
          updated_at: new Date(Date.now() - 259200000).toISOString(),
          is_active: true,
          messages_count: 4,
          unread_messages_count: 0,
        },
        {
          id: 6,
          public_id: "ticket-6",
          subject: "سوال در مورد قیمت‌ها",
          description: "آیا تخفیف خاصی برای خرید عمده وجود دارد؟",
          status: "in_progress",
          priority: "low",
          user: {
            id: 6,
            mobile: "09123456794",
            email: "hasan@example.com",
            full_name: "حسن علوی",
          },
          assigned_admin: {
            id: 1,
            user: {
              id: 1,
              username: "admin",
              email: "admin@example.com",
            },
          },
          last_replied_at: new Date(Date.now() - 1800000).toISOString(),
          created_at: new Date(Date.now() - 432000000).toISOString(),
          updated_at: new Date(Date.now() - 1800000).toISOString(),
          is_active: true,
          messages_count: 2,
          unread_messages_count: 0,
        },
      ];

      const mockMessagesData: Record<number, TicketMessage[]> = {
        1: [
          {
            id: 1,
            public_id: "msg-1",
            ticket: 1,
            message: "سلام، من نمی‌توانم به حساب کاربری خود وارد شوم. پیام خطا می‌دهد که رمز عبور اشتباه است.",
            sender_type: "user",
            sender_user: {
              id: 1,
              mobile: "09123456789",
              email: "ali@example.com",
              full_name: "علی احمدی",
            },
            is_read: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            attachments: [],
          },
        ],
        2: [
          {
            id: 2,
            public_id: "msg-2",
            ticket: 2,
            message: "می‌خواهم اطلاعات پروفایلم را تغییر دهم اما گزینه ویرایش کار نمی‌کند.",
            sender_type: "user",
            sender_user: {
              id: 2,
              mobile: "09123456790",
              email: "mohammad@example.com",
              full_name: "محمد رضایی",
            },
            is_read: true,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: new Date(Date.now() - 86400000).toISOString(),
            attachments: [],
          },
          {
            id: 3,
            public_id: "msg-3",
            ticket: 2,
            message: "لطفاً صفحه را refresh کنید و دوباره تلاش کنید.",
            sender_type: "admin",
            sender_admin: {
              id: 1,
              user: {
                id: 1,
                username: "admin",
                email: "admin@example.com",
              },
            },
            is_read: true,
            created_at: new Date(Date.now() - 82800000).toISOString(),
            updated_at: new Date(Date.now() - 82800000).toISOString(),
            attachments: [],
          },
          {
            id: 4,
            public_id: "msg-4",
            ticket: 2,
            message: "ممنون، مشکل حل شد.",
            sender_type: "user",
            sender_user: {
              id: 2,
              mobile: "09123456790",
              email: "mohammad@example.com",
              full_name: "محمد رضایی",
            },
            is_read: true,
            created_at: new Date(Date.now() - 3600000).toISOString(),
            updated_at: new Date(Date.now() - 3600000).toISOString(),
            attachments: [],
          },
        ],
        3: [
          {
            id: 5,
            public_id: "msg-5",
            ticket: 3,
            message: "می‌خواهم اطلاعات بیشتری در مورد محصولات شما بدانم.",
            sender_type: "user",
            sender_user: {
              id: 3,
              mobile: "09123456791",
              email: "sara@example.com",
              full_name: "سارا کریمی",
            },
            is_read: true,
            created_at: new Date(Date.now() - 172800000).toISOString(),
            updated_at: new Date(Date.now() - 172800000).toISOString(),
            attachments: [],
          },
          {
            id: 6,
            public_id: "msg-6",
            ticket: 3,
            message: "حتماً، لطفاً به صفحه محصولات مراجعه کنید.",
            sender_type: "admin",
            sender_admin: {
              id: 1,
              user: {
                id: 1,
                username: "admin",
                email: "admin@example.com",
              },
            },
            is_read: true,
            created_at: new Date(Date.now() - 172000000).toISOString(),
            updated_at: new Date(Date.now() - 172000000).toISOString(),
            attachments: [],
          },
        ],
        4: [
          {
            id: 7,
            public_id: "msg-7",
            ticket: 4,
            message: "اپلیکیشن موبایل من crash می‌کند وقتی می‌خواهم عکس آپلود کنم.",
            sender_type: "user",
            sender_user: {
              id: 4,
              mobile: "09123456792",
              email: "reza@example.com",
              full_name: "رضا محمودی",
            },
            is_read: false,
            created_at: new Date(Date.now() - 7200000).toISOString(),
            updated_at: new Date(Date.now() - 7200000).toISOString(),
            attachments: [],
          },
        ],
      };

      setMockTickets(mockTicketsData);
      setMockMessages(mockMessagesData);
    }
  }, []);

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
      open: tickets.filter(t => t.status === 'open').length,
      in_progress: tickets.filter(t => t.status === 'in_progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      closed: tickets.filter(t => t.status === 'closed').length,
    };
  }, [tickets]);

  return (
    <div className="flex h-[calc(100vh-4rem-4rem)] bg-card overflow-hidden rounded-lg border shadow-[rgb(0_0_0/2%)_0px_6px_24px_0px,rgb(0_0_0/2%)_0px_0px_0px_1px]">
      <div className="w-64 flex-shrink-0 h-full overflow-hidden bg-card">
        <TicketSidebar
          selectedStatus={selectedStatus}
          onStatusChange={handleStatusChange}
          onCreateClick={() => setCreateOpen(true)}
          statusCounts={statusCounts}
        />
      </div>

      <div className="w-[1px] h-full bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {selectedTicket ? (
          <TicketDetailView
            ticket={ticketDetail || selectedTicket}
            messages={mockTickets.length > 0 ? (mockMessages[selectedTicket.id] || []) : ticketMessages}
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
                  <TicketToolbar onRefresh={() => refetch()} />
                </div>
              </div>
            </div>

            <TicketList
              tickets={filteredTickets}
              selectedTickets={selectedTickets}
              onSelectTicket={handleSelectTicket}
              onTicketClick={handleTicketClick}
              loading={mockTickets.length === 0 && isLoading}
            />
          </>
        )}
      </div>

      <CreateTicketDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={handleCreateTicket}
      />

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

