"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { EmailSidebar, EmailList, EmailSearch, EmailToolbar, EmailDetailView, type ComposeEmailData } from "@/components/email";
import { ComposeEmailDialog } from "@/components/email/ComposeEmailDialog";
import { Checkbox } from "@/components/elements/Checkbox";
import { emailApi } from "@/api/email/route";
import { EmailMessage } from "@/types/email/emailMessage";
import { MailboxType } from "@/components/email/types";
import { toast } from "@/components/elements/Sonner";
import { useQueryClient } from '@tanstack/react-query';

export default function EmailPage() {
  const queryClient = useQueryClient();
  const [selectedMailbox, setSelectedMailbox] = useState<MailboxType>("inbox");
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmails, setSelectedEmails] = useState<Set<number>>(new Set());
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [replyToEmail, setReplyToEmail] = useState<EmailMessage | null>(null);

  const fetchEmails = useCallback(async () => {
    try {
      setLoading(true);
      const statusMap: Record<MailboxType, string | undefined> = {
        inbox: undefined,  // نمایش همه ایمیل‌ها (new و read)
        draft: "draft",
        starred: "replied",
        spam: "archived",
        sent: "read",
        trash: undefined,
      };
      
      const response = await emailApi.getList({
        page: 1,
        size: 50,
        search: searchQuery || undefined,
        status: statusMap[selectedMailbox],
      });
      setEmails(response.data);
    } catch (error) {
      toast.error("خطا در دریافت ایمیل‌ها");
    } finally {
      setLoading(false);
    }
  }, [selectedMailbox, searchQuery]);

  useEffect(() => {
    // دریافت ایمیل‌ها از API واقعی
    fetchEmails();
  }, [fetchEmails]);

  const handleMailboxChange = useCallback((mailbox: MailboxType) => {
    setSelectedMailbox(mailbox);
    setSelectedEmails(new Set());
    setSelectedEmail(null);
  }, []);

  const handleSelectEmail = useCallback((emailId: number) => {
    setSelectedEmails(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(emailId)) {
        newSelected.delete(emailId);
      } else {
        newSelected.add(emailId);
      }
      return newSelected;
    });
  }, []);

  const handleSelectAll = useCallback((filteredEmails: EmailMessage[]) => {
    setSelectedEmails(prev => {
      const filteredIds = new Set(filteredEmails.map((e) => e.id));
      const allSelected = filteredEmails.length > 0 && filteredEmails.every(e => prev.has(e.id));
      if (allSelected) {
        return new Set([...prev].filter(id => !filteredIds.has(id)));
      }
      return new Set([...prev, ...filteredEmails.map(e => e.id)]);
    });
  }, []);

  const handleEmailClick = useCallback(async (email: EmailMessage) => {
    setSelectedEmail(email);
    
    // اگر ایمیل جدید بود، mark as read کن
    if (email.status === 'new') {
      try {
        await emailApi.markAsRead(email.id);
        // به‌روزرسانی لیست ایمیل‌ها
        setEmails(prev => prev.map(e => 
          e.id === email.id ? { ...e, status: 'read' as const, is_new: false } : e
        ));
        // Invalidate notification count
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      } catch (error) {
        console.error('Failed to mark email as read:', error);
      }
    }
  }, [queryClient]);

  const handleReplyEmail = useCallback((email: EmailMessage) => {
    setReplyToEmail(email);
    setComposeOpen(true);
  }, []);

  const handleDeleteEmail = useCallback(async (email: EmailMessage) => {
    try {
      setEmails(prev => prev.filter(e => e.id !== email.id));
      setSelectedEmail(null);
      toast.success("ایمیل با موفقیت حذف شد");
    } catch (error) {
      toast.error("خطا در حذف ایمیل");
    }
  }, []);

  const handleMarkAsRead = useCallback(async () => {
    if (selectedEmails.size === 0) {
      toast.error("لطفا ابتدا ایمیل‌هایی را انتخاب کنید");
      return;
    }
    try {
      toast.success("ایمیل‌ها به عنوان خوانده شده علامت‌گذاری شدند");
      fetchEmails();
      setSelectedEmails(new Set());
    } catch (error) {
      toast.error("خطا در علامت‌گذاری ایمیل‌ها");
    }
  }, [selectedEmails.size, fetchEmails]);

  const handleMarkAsUnread = useCallback(async () => {
    if (selectedEmails.size === 0) {
      toast.error("لطفا ابتدا ایمیل‌هایی را انتخاب کنید");
      return;
    }
    try {
      toast.success("ایمیل‌ها به عنوان نخوانده علامت‌گذاری شدند");
      fetchEmails();
      setSelectedEmails(new Set());
    } catch (error) {
      toast.error("خطا در علامت‌گذاری ایمیل‌ها");
    }
  }, [selectedEmails.size, fetchEmails]);

  const handleSendEmail = useCallback(async (data: ComposeEmailData) => {
    try {
      // اگه ریپلای به ایمیل هست، از endpoint mark_as_replied استفاده کن
      if (replyToEmail) {
        await emailApi.markAsReplied(replyToEmail.id, data.message);
        toast.success("پاسخ با موفقیت ارسال شد");
      } else {
        // ایمیل جدید
        await emailApi.create({
          name: data.to.split("@")[0],
          email: data.to,
          subject: data.subject,
          message: data.message,
          source: "email",
          status: "new",
        });
        toast.success("ایمیل با موفقیت ارسال شد");
      }
      setReplyToEmail(null);
      fetchEmails();
    } catch (error: any) {
      const errorMessage = error.message || 'خطا در ارسال ایمیل';
      toast.error(errorMessage);
    }
  }, [fetchEmails, replyToEmail]);

  const handleSaveDraft = useCallback(async (data: ComposeEmailData) => {
    try {
      await emailApi.saveDraft({
        name: data.to.split("@")[0] || "بدون نام",
        email: data.to || "draft@example.com",
        subject: data.subject || "پیش‌نویس بدون موضوع",
        message: data.message || "",
        source: "email",
      });
      toast.success("پیش‌نویس با موفقیت ذخیره شد");
      fetchEmails();
    } catch (error) {
      toast.error("خطا در ذخیره پیش‌نویس");
    }
  }, [fetchEmails]);

  const handlePublishDraft = useCallback(async (email: EmailMessage) => {
    try {
      await emailApi.update(email.id, {
        status: "new",
      });
      toast.success("پیش‌نویس با موفقیت منتشر شد");
      setSelectedEmail(null);
      fetchEmails();
    } catch (error) {
      toast.error("خطا در انتشار پیش‌نویس");
    }
  }, [fetchEmails]);

  const handleToggleStar = useCallback(async (email: EmailMessage) => {
    try {
      await emailApi.toggleStar(email.id);
      const updatedEmail = { ...email, is_starred: !email.is_starred };
      setEmails(prev => prev.map(e => e.id === email.id ? updatedEmail : e));
      if (selectedEmail?.id === email.id) {
        setSelectedEmail(updatedEmail);
      }
      toast.success(email.is_starred ? "ستاره حذف شد" : "ستاره اضافه شد");
    } catch (error) {
      toast.error("خطا در تغییر وضعیت ستاره");
    }
  }, [selectedEmail]);

  const filteredEmails = useMemo(() => {
    switch (selectedMailbox) {
      case "inbox":
        // صندوق ورودی: فقط ایمیل‌های دریافتی از کاربران (source=website یا mobile_app)
        return emails.filter(e => 
          e.status !== 'draft' && 
          e.status !== 'archived' &&
          (e.source === 'website' || e.source === 'mobile_app')  // فقط ایمیل‌های دریافتی
        );
      case "sent":
        // ارسال شده: فقط ایمیل‌هایی که از پنل ادمین ارسال شده (source=email)
        return emails.filter(e => e.source === 'email' && e.status !== 'draft');
      case "draft":
        // پیش‌نویس: فقط draft ها
        return emails.filter(e => e.status === 'draft' || e.is_draft);
      case "starred":
        // ستاره‌دار: فقط ایمیل‌های ستاره‌دار
        return emails.filter(e => e.is_starred === true);
      case "spam":
        // هرزنامه: archived با کلمه spam
        return emails.filter(e => 
          e.status === 'archived' && (
            e.subject?.toLowerCase().includes('هرزنامه') || 
            e.subject?.toLowerCase().includes('spam') || 
            e.email?.toLowerCase().includes('spam')
          )
        );
      case "trash":
        // سطل زباله: archived با کلمه deleted
        return emails.filter(e => 
          e.status === 'archived' && (
            e.subject?.toLowerCase().includes('حذف') || 
            e.subject?.toLowerCase().includes('deleted') || 
            e.email?.toLowerCase().includes('deleted')
          )
        );
      default:
        return emails;
    }
  }, [emails, selectedMailbox]);

  const mailboxCounts = useMemo(() => {
    return {
      inbox: emails.filter(e => 
        e.status !== 'draft' && 
        e.status !== 'archived' &&
        (e.source === 'website' || e.source === 'mobile_app')
      ).length,
      sent: emails.filter(e => e.source === 'email' && e.status !== 'draft').length,
      draft: emails.filter(e => e.status === 'draft' || e.is_draft).length,
      starred: emails.filter(e => e.is_starred === true).length,
      spam: emails.filter(e => 
        e.status === 'archived' && (
          e.subject?.toLowerCase().includes('هرزنامه') || 
          e.subject?.toLowerCase().includes('spam') || 
          e.email?.toLowerCase().includes('spam')
        )
      ).length,
      trash: emails.filter(e => 
        e.status === 'archived' && (
          e.subject?.toLowerCase().includes('حذف') || 
          e.subject?.toLowerCase().includes('deleted') || 
          e.email?.toLowerCase().includes('deleted')
        )
      ).length,
    };
  }, [emails]);

  return (
    <div className="flex h-[calc(100vh-4rem-4rem)] bg-card overflow-hidden rounded-lg border shadow-[rgb(0_0_0/2%)_0px_6px_24px_0px,rgb(0_0_0/2%)_0px_0px_0px_1px]">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 h-full overflow-hidden bg-card">
        <EmailSidebar
          selectedMailbox={selectedMailbox}
          onMailboxChange={handleMailboxChange}
          onComposeClick={() => setComposeOpen(true)}
          mailboxCounts={mailboxCounts}
        />
      </div>

      {/* Divider */}
      <div className="w-[1px] h-full bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>

      {/* Main Content - List or Detail */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {selectedEmail ? (
          <EmailDetailView
            email={selectedEmail}
            onReply={handleReplyEmail}
            onDelete={handleDeleteEmail}
            onPublish={handlePublishDraft}
            onToggleStar={handleToggleStar}
            mailbox={selectedMailbox}
          />
        ) : (
          <>
            {/* Header with Toolbar and Search */}
            <div className="border-b p-4 flex-shrink-0">
              <div className="flex items-center gap-4">
                {/* Search and Select All - Left side */}
                <div className="flex items-center gap-3 flex-1">
                  <Checkbox
                    checked={
                      filteredEmails.length > 0 && filteredEmails.every(e => selectedEmails.has(e.id))
                        ? true
                        : filteredEmails.some(e => selectedEmails.has(e.id))
                        ? "indeterminate"
                        : false
                    }
                    onCheckedChange={() => handleSelectAll(filteredEmails)}
                    aria-label="انتخاب همه"
                  />
                  <EmailSearch value={searchQuery} onChange={setSearchQuery} />
                </div>

                {/* Toolbar Icons - Right side */}
                <div className="flex items-center gap-2">
                  <EmailToolbar
                    selectedCount={selectedEmails.size}
                    totalCount={filteredEmails.length}
                    onSelectAll={() => handleSelectAll(filteredEmails)}
                    onRefresh={fetchEmails}
                    onMarkAsRead={handleMarkAsRead}
                    onMarkAsUnread={handleMarkAsUnread}
                    mailbox={selectedMailbox}
                  />
                </div>
              </div>
            </div>

            {/* Email List */}
            <EmailList
              emails={filteredEmails}
              selectedEmails={selectedEmails}
              onSelectEmail={handleSelectEmail}
              onEmailClick={handleEmailClick}
              onToggleStar={handleToggleStar}
              mailbox={selectedMailbox}
              loading={loading}
            />
          </>
        )}
      </div>

      {/* Compose Email Dialog */}
      <ComposeEmailDialog
        open={composeOpen}
        onOpenChange={(open) => {
          setComposeOpen(open);
          if (!open) {
            setReplyToEmail(null);
          }
        }}
        onSend={handleSendEmail}
        onSaveDraft={handleSaveDraft}
        replyTo={replyToEmail}
      />
    </div>
  );
}
