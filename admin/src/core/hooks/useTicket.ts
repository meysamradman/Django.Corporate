import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ticketApi } from "@/api/ticket/route";
import {
  Ticket,
  TicketMessage,
  TicketCreate,
  TicketUpdate,
  TicketMessageCreate,
  TicketListParams,
} from "@/types/ticket/ticket";
import { toast } from "@/components/elements/Sonner";

export function useTicketList(params: TicketListParams = {}) {
  return useQuery({
    queryKey: ['tickets', params],
    queryFn: () => ticketApi.getList(params),
  });
}

export function useTicket(id: number | string | null) {
  return useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketApi.getById(id!),
    enabled: !!id,
  });
}

export function useTicketMessages(ticketId: number | string | null) {
  return useQuery({
    queryKey: ['ticket-messages', ticketId],
    queryFn: () => ticketApi.getMessages(ticketId!),
    enabled: !!ticketId,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: TicketCreate) => ticketApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success("تیکت با موفقیت ایجاد شد");
    },
    onError: (error: any) => {
      toast.error(error?.message || "خطا در ایجاد تیکت");
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
      toast.success("تیکت با موفقیت به‌روزرسانی شد");
    },
    onError: (error: any) => {
      toast.error(error?.message || "خطا در به‌روزرسانی تیکت");
    },
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number | string) => ticketApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success("تیکت با موفقیت حذف شد");
    },
    onError: (error: any) => {
      toast.error(error?.message || "خطا در حذف تیکت");
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
      toast.success("تیکت با موفقیت اختصاص داده شد");
    },
    onError: (error: any) => {
      toast.error(error?.message || "خطا در اختصاص تیکت");
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
      toast.success("وضعیت تیکت با موفقیت به‌روزرسانی شد");
    },
    onError: (error: any) => {
      toast.error(error?.message || "خطا در به‌روزرسانی وضعیت تیکت");
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
      toast.success("پیام با موفقیت ارسال شد");
    },
    onError: (error: any) => {
      toast.error(error?.message || "خطا در ارسال پیام");
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
    },
    onError: (error: any) => {
      toast.error(error?.message || "خطا در علامت‌گذاری پیام");
    },
  });
}

