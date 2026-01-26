import { useState, useEffect, lazy, Suspense } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/elements/Dialog";
import { Textarea } from "@/components/elements/Textarea";
import { Label } from "@/components/elements/Label";
import { Send, Paperclip } from "lucide-react";
import type { Ticket } from "@/types/ticket/ticket";
import { ProtectedButton } from "@/core/permissions/components/ProtectedButton";

const MediaLibraryModal = lazy(() => import("@/components/media/modals/MediaLibraryModal").then(mod => ({ default: mod.MediaLibraryModal })));

import type { ReplyTicketData } from '@/types/ticket/ticket';

interface ReplyTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (data: ReplyTicketData) => void;
  ticket?: Ticket | null;
}

export function TicketReplyDialog({
  open,
  onOpenChange,
  onSend,
  ticket,
}: ReplyTicketDialogProps) {
  const [message, setMessage] = useState("");
  const [attachmentIds, setAttachmentIds] = useState<number[]>([]);
  const [sending, setSending] = useState(false);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setMessage("");
      setAttachmentIds([]);
    }
  }, [open]);

  const handleSend = async () => {
    if (!message.trim()) {
      return;
    }
    setSending(true);
    try {
      await onSend({ message, attachment_ids: attachmentIds.length > 0 ? attachmentIds : undefined });
      onOpenChange(false);
      setMessage("");
      setAttachmentIds([]);
    } catch (error) {
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>پاسخ به تیکت</DialogTitle>
          </DialogHeader>
          <div className="flex-shrink-0 space-y-4 py-4">
            {ticket && (
              <div className="bg-bg/50 rounded-lg p-3">
                <div className="text-sm font-semibold mb-1">{ticket.subject}</div>
                <div className="text-xs text-font-s">{ticket.description.substring(0, 100)}...</div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="message">پیام *</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="پیام خود را بنویسید..."
                rows={8}
                className="resize-none"
              />
            </div>
            {attachmentIds.length > 0 && (
              <div className="text-xs text-font-s">
                {attachmentIds.length} فایل انتخاب شده است
              </div>
            )}
          </div>
          <DialogFooter className="flex-shrink-0">
            <ProtectedButton
              variant="outline"
              onClick={() => setMediaLibraryOpen(true)}
              permission={['ticket.manage', 'ticket.create']}
              requireAll={false}
              showDenyToast={false}
            >
              <Paperclip className="size-4" />
              افزودن پیوست
            </ProtectedButton>
            <ProtectedButton
              variant="default"
              onClick={handleSend}
              disabled={!message.trim() || sending}
              permission={['ticket.manage', 'ticket.create']}
              requireAll={false}
              showDenyToast={false}
            >
              <Send className="size-4" />
              {sending ? "در حال ارسال..." : "ارسال"}
            </ProtectedButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {mediaLibraryOpen && (
        <Suspense fallback={<div>در حال بارگذاری...</div>}>
          <MediaLibraryModal
          isOpen={mediaLibraryOpen}
          onClose={() => setMediaLibraryOpen(false)}
          onSelect={(mediaItems) => {
            const items = Array.isArray(mediaItems) ? mediaItems : [mediaItems];
            setAttachmentIds(items.map(m => m.id));
            setMediaLibraryOpen(false);
          }}
          selectMultiple={true}
          initialFileType="all"
        />
        </Suspense>
      )}
    </>
  );
}

