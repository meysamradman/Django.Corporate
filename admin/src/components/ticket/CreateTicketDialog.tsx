"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/elements/Dialog";
import { Input } from "@/components/elements/Input";
import { Textarea } from "@/components/elements/Textarea";
import { Label } from "@/components/elements/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { Send } from "lucide-react";
import { ProtectedButton } from "@/core/permissions/components/ProtectedButton";

const MediaLibraryModal = dynamic(() => import("@/components/media/modals/MediaLibraryModal").then(mod => ({ default: mod.MediaLibraryModal })), {
  ssr: false,
});

export interface CreateTicketData {
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  message?: string;
  attachment_ids?: number[];
}

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: CreateTicketData) => void;
}

export function CreateTicketDialog({
  open,
  onOpenChange,
  onCreate,
}: CreateTicketDialogProps) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [message, setMessage] = useState("");
  const [attachmentIds, setAttachmentIds] = useState<number[]>([]);
  const [creating, setCreating] = useState(false);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setSubject("");
      setDescription("");
      setPriority('medium');
      setMessage("");
      setAttachmentIds([]);
    }
  }, [open]);

  const handleCreate = async () => {
    if (!subject.trim() || !description.trim()) {
      return;
    }
    setCreating(true);
    try {
      await onCreate({ 
        subject, 
        description, 
        priority,
        message: message.trim() || undefined,
        attachment_ids: attachmentIds.length > 0 ? attachmentIds : undefined 
      });
      onOpenChange(false);
      setSubject("");
      setDescription("");
      setPriority('medium');
      setMessage("");
      setAttachmentIds([]);
    } catch (error) {
      // Error handled by parent component
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>ایجاد تیکت جدید</DialogTitle>
          </DialogHeader>
          <div className="flex-shrink-0 space-y-4 py-4 overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="subject">موضوع *</Label>
              <Input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="موضوع تیکت را وارد کنید..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">اولویت</Label>
              <Select value={priority} onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => setPriority(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب اولویت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">پایین</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="high">بالا</SelectItem>
                  <SelectItem value="urgent">فوری</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">توضیحات *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="توضیحات تیکت را وارد کنید..."
                rows={6}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">پیام اولیه (اختیاری)</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="پیام اولیه برای تیکت..."
                rows={4}
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
              permission="ticket.manage"
              showDenyToast={false}
            >
              افزودن پیوست
            </ProtectedButton>
            <ProtectedButton
              variant="default"
              onClick={handleCreate}
              disabled={!subject.trim() || !description.trim() || creating}
              permission="ticket.manage"
              showDenyToast={false}
            >
              <Send className="size-4" />
              {creating ? "در حال ایجاد..." : "ایجاد تیکت"}
            </ProtectedButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {mediaLibraryOpen && (
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
      )}
    </>
  );
}

