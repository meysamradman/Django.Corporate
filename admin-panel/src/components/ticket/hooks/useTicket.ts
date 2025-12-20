import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ticketApi } from "@/api/ticket/ticket";
import type {
  Ticket,
  TicketMessage,
  TicketCreate,
  TicketUpdate,
  TicketMessageCreate,
  TicketListParams,
} from "@/types/ticket/ticket";
import { showError, showSuccess } from "@/core/toast";

export function useTicketStats() {
  return useQuery({
    queryKey: ['ticket-stats'],
    queryFn: async () => {
      return { new_tickets_count: 0, assigned_to_me_count: 0, total_new: 0 };
    },
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 30000, // Refetch every 30 seconds for ticket stats
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useTicketList(params: TicketListParams = {}) {
  return useQuery({
    queryKey: ['tickets', params],
    queryFn: () => ticketApi.getList(params),
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 30000, // Refetch every 30 seconds for ticket list
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useTicket(id: number | string | null) {
  return useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketApi.getById(id!),
    enabled: !!id,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useTicketMessages(ticketId: number | string | null) {
  return useQuery({
    queryKey: ['ticket-messages', ticketId],
    queryFn: () => ticketApi.getMessages(ticketId!),
    enabled: !!ticketId,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TicketCreate) => ticketApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      showSuccess("تیکت با موفقیت ایجاد شد");
    },
    onError: (error: any) => {
      showError(error?.message || "خطا در ایجاد تیکت");
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: TicketUpdate }) =>
      ticketApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.id] });
      showSuccess("تیکت با موفقیت به‌روزرسانی شد");
    },
    onError: (error: any) => {
      showError(error?.message || "خطا در به‌روزرسانی تیکت");
    },
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => ticketApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      showSuccess("تیکت با موفقیت حذف شد");
    },
    onError: (error: any) => {
      showError(error?.message || "خطا در حذف تیکت");
    },
  });
}

export function useAssignTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, adminId }: { id: number | string; adminId: number | null }) =>
      ticketApi.assign(id, adminId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.id] });
      showSuccess("تیکت با موفقیت اختصاص داده شد");
    },
    onError: (error: any) => {
      showError(error?.message || "خطا در اختصاص تیکت");
    },
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number | string; status: Ticket['status'] }) =>
      ticketApi.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });
      showSuccess("وضعیت تیکت با موفقیت به‌روزرسانی شد");
    },
    onError: (error: any) => {
      showError(error?.message || "خطا در به‌روزرسانی وضعیت تیکت");
    },
  });
}

export function useCreateTicketMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TicketMessageCreate) => ticketApi.createMessage(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-messages', data.ticket] });
      queryClient.invalidateQueries({ queryKey: ['ticket', data.ticket] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });
      showSuccess("پیام با موفقیت ارسال شد");
    },
    onError: (error: any) => {
      showError(error?.message || "خطا در ارسال پیام");
    },
  });
}

export function useMarkMessageRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: number | string) => ticketApi.markMessageRead(messageId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-messages', data.ticket] });
      queryClient.invalidateQueries({ queryKey: ['ticket', data.ticket] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
    },
  });
}

export function useMarkTicketAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketId: number | string) => ticketApi.markTicketAsRead(ticketId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-messages', data.id] });
      queryClient.invalidateQueries({ queryKey: ['ticket', data.id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });
    },
    onError: (error: any) => {
    },
  });
}
