"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/elements/Dialog";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import {
  Send,
  Paperclip,
  Trash2,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  X,
  Save,
} from "lucide-react";
import { cn } from "@/core/utils/cn";
import { EmailMessage } from "@/api/email/route";
import {
  CustomTooltip,
  CustomTooltipTrigger,
  CustomTooltipContent,
} from "@/components/elements/Tooltip";
import { toast } from "@/components/elements/Sonner";

interface ComposeEmailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend?: (data: ComposeEmailData) => void;
  onSaveDraft?: (data: ComposeEmailData) => void;
  replyTo?: EmailMessage | null;
  draftId?: number | null;
}

export interface ComposeEmailData {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  message: string;
  attachments?: File[];
}

export function ComposeEmail({ open, onOpenChange, onSend, onSaveDraft, replyTo, draftId }: ComposeEmailProps) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draftKey = "email_draft";

  useEffect(() => {
    if (open && !replyTo) {
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          if (draft.subject || draft.message || draft.to) {
            setTo(draft.to || "");
            setSubject(draft.subject || "");
            setMessage(draft.message || "");
          }
        } catch (e) {
          console.error("Error loading draft:", e);
        }
      }
    }
  }, [open, replyTo]);

  useEffect(() => {
    if (open && !replyTo && (subject || message || to)) {
      const draft = { to, subject, message };
      localStorage.setItem(draftKey, JSON.stringify(draft));
    }
  }, [to, subject, message, open, replyTo]);

  useEffect(() => {
    if (open && replyTo) {
      setTo(replyTo.email);
      const replySubject = replyTo.subject.startsWith("پاسخ:") 
        ? replyTo.subject 
        : `پاسخ: ${replyTo.subject}`;
      setSubject(replySubject);
      
      const formattedDate = new Date(replyTo.created_at).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      
      const quotedMessage = `\n\n---\nدر تاریخ ${formattedDate}، ${replyTo.name} <${replyTo.email}> نوشت:\n\n${replyTo.message.split('\n').map(line => `> ${line}`).join('\n')}`;
      setMessage(quotedMessage);
    } else if (open && !replyTo) {
      setAttachments([]);
    }
  }, [open, replyTo]);

  const handleSend = async () => {
    if (!to.trim() || !subject.trim() || !message.trim()) {
      return;
    }

    setSending(true);
    try {
      await onSend?.({
        to,
        subject,
        message,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      
      setTo("");
      setSubject("");
      setMessage("");
      setAttachments([]);
      localStorage.removeItem(draftKey);
      onOpenChange(false);
    } catch (error) {
      console.error("Error sending email:", error);
    } finally {
      setSending(false);
    }
  };

  const handleDiscard = () => {
    setTo("");
    setSubject("");
    setMessage("");
    setAttachments([]);
    localStorage.removeItem(draftKey);
    onOpenChange(false);
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setAttachments(prev => [...prev, ...Array.from(files)]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async () => {
    if (!subject && !message && !to) {
      toast.error("هیچ محتوایی برای ذخیره وجود ندارد");
      return;
    }
    
    if (onSaveDraft) {
      try {
        await onSaveDraft({
          to,
          subject,
          message,
          attachments: attachments.length > 0 ? attachments : undefined,
        });
        const draft = { to, subject, message };
        localStorage.setItem(draftKey, JSON.stringify(draft));
      } catch (error) {
        console.error("Error saving draft:", error);
      }
    } else {
      const draft = { to, subject, message };
      localStorage.setItem(draftKey, JSON.stringify(draft));
      toast.success("پیش‌نویس با موفقیت ذخیره شد");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-h-[75vh] flex flex-col"
        style={{ maxWidth: '56rem', width: '90vw' }}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{replyTo ? "پاسخ به ایمیل" : "ایجاد ایمیل"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-shrink-0">
          {/* To Field */}
          <div className="flex items-center gap-2">
            <Label htmlFor="to" className="w-20 shrink-0">
              گیرنده:
            </Label>
            <Input
              id="to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="ایمیل گیرنده را وارد کنید"
              className="flex-1"
            />
          </div>

          {/* Subject Field */}
          <div className="flex items-center gap-2">
            <Label htmlFor="subject" className="w-20 shrink-0">
              موضوع:
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="موضوع ایمیل"
              className="flex-1"
            />
          </div>
        </div>

        {/* Formatting Toolbar */}
        <div className="flex items-center gap-1 p-2 border border-border rounded-md bg-muted/30 flex-shrink-0">
          <CustomTooltip>
            <CustomTooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="h-7 w-7">
                <Bold className="size-3.5" />
              </Button>
            </CustomTooltipTrigger>
            <CustomTooltipContent>ضخیم</CustomTooltipContent>
          </CustomTooltip>
          <CustomTooltip>
            <CustomTooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="h-7 w-7">
                <Italic className="size-3.5" />
              </Button>
            </CustomTooltipTrigger>
            <CustomTooltipContent>ایتالیک</CustomTooltipContent>
          </CustomTooltip>
          <CustomTooltip>
            <CustomTooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="h-7 w-7">
                <Underline className="size-3.5" />
              </Button>
            </CustomTooltipTrigger>
            <CustomTooltipContent>زیرخط</CustomTooltipContent>
          </CustomTooltip>
          <div className="w-px h-4 bg-border mx-1" />
          <CustomTooltip>
            <CustomTooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="h-7 w-7">
                <List className="size-3.5" />
              </Button>
            </CustomTooltipTrigger>
            <CustomTooltipContent>لیست</CustomTooltipContent>
          </CustomTooltip>
          <CustomTooltip>
            <CustomTooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="h-7 w-7">
                <ListOrdered className="size-3.5" />
              </Button>
            </CustomTooltipTrigger>
            <CustomTooltipContent>لیست شماره‌دار</CustomTooltipContent>
          </CustomTooltip>
          <div className="w-px h-4 bg-border mx-1" />
          <CustomTooltip>
            <CustomTooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="h-7 w-7">
                <LinkIcon className="size-3.5" />
              </Button>
            </CustomTooltipTrigger>
            <CustomTooltipContent>لینک</CustomTooltipContent>
          </CustomTooltip>
          <CustomTooltip>
            <CustomTooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon-sm" 
                className="h-7 w-7"
                onClick={handleAttachmentClick}
              >
                <ImageIcon className="size-3.5" />
              </Button>
            </CustomTooltipTrigger>
            <CustomTooltipContent>افزودن عکس</CustomTooltipContent>
          </CustomTooltip>
          <CustomTooltip>
            <CustomTooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon-sm" 
                className="h-7 w-7"
                onClick={handleAttachmentClick}
              >
                <Paperclip className="size-3.5" />
              </Button>
            </CustomTooltipTrigger>
            <CustomTooltipContent>افزودن پیوست</CustomTooltipContent>
          </CustomTooltip>
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md border border-border"
              >
                <Paperclip className="size-3.5 text-muted-foreground" />
                <span className="text-sm text-foreground">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-5 w-5"
                  onClick={() => removeAttachment(index)}
                >
                  <X className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Message Field - Only this should scroll */}
        <div className="flex-1 min-h-0">
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="متن پیام خود را بنویسید..."
            dir="rtl"
            className="w-full h-full min-h-[300px] resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 overflow-y-auto"
          />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={sending || (!subject && !message && !to)}
            >
              <Save className="size-4 ml-2" />
              <span>ذخیره پیش‌نویس</span>
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handleSend}
              disabled={sending || !to.trim() || !subject.trim() || !message.trim()}
            >
              <Send className="size-4 ml-2" />
              <span>{sending ? "در حال ارسال..." : "ارسال"}</span>
            </Button>
          </div>

          <Button variant="ghost" size="icon" onClick={handleDiscard}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

