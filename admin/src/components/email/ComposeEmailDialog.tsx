"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/elements/Dialog";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { Textarea } from "@/components/elements/Textarea";
import { Label } from "@/components/elements/Label";
import { Send, Save } from "lucide-react";
import { EmailMessage } from "@/api/email/route";

export interface ComposeEmailData {
  to: string;
  subject: string;
  message: string;
}

interface ComposeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (data: ComposeEmailData) => void;
  onSaveDraft: (data: ComposeEmailData) => void;
  replyTo?: EmailMessage | null;
}

export function ComposeEmailDialog({
  open,
  onOpenChange,
  onSend,
  onSaveDraft,
  replyTo,
}: ComposeEmailDialogProps) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  useEffect(() => {
    if (open) {
      if (replyTo) {
        setTo(replyTo.email);
        setSubject(replyTo.subject.startsWith("Re:") ? replyTo.subject : `Re: ${replyTo.subject}`);
        setMessage(`\n\n--- پیام قبلی ---\n${replyTo.message}\n`);
      } else {
        setTo("");
        setSubject("");
        setMessage("");
      }
    }
  }, [open, replyTo]);

  const handleSend = async () => {
    if (!to.trim() || !subject.trim() || !message.trim()) {
      return;
    }
    setSending(true);
    try {
      await onSend({ to, subject, message });
      onOpenChange(false);
      setTo("");
      setSubject("");
      setMessage("");
    } catch (error) {
      console.error("Error sending email:", error);
    } finally {
      setSending(false);
    }
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      await onSaveDraft({ to, subject, message });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving draft:", error);
    } finally {
      setSavingDraft(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{replyTo ? "پاسخ به ایمیل" : "ایجاد ایمیل جدید"}</DialogTitle>
        </DialogHeader>
        <div className="flex-shrink-0 space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="to">به *</Label>
            <Input
              id="to"
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="example@email.com"
              disabled={!!replyTo}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">موضوع *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="موضوع ایمیل"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">پیام *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="متن ایمیل را بنویسید..."
              className="resize-none min-h-[200px] max-h-[400px] overflow-y-auto"
            />
          </div>
        </div>
        <DialogFooter className="flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={sending || savingDraft}
          >
            <Save className="w-4 h-4 me-2" />
            {savingDraft ? "در حال ذخیره..." : "ذخیره پیش‌نویس"}
          </Button>
          <Button
            onClick={handleSend}
            disabled={!to.trim() || !subject.trim() || !message.trim() || sending || savingDraft}
          >
            <Send className="w-4 h-4 me-2" />
            {sending ? "در حال ارسال..." : "ارسال"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

