import { useState, useEffect, useCallback, useMemo, lazy } from "react";
import { useLocation } from "react-router-dom";

import { EmailSidebar, EmailList, EmailSearch, EmailToolbar, type ComposeEmailData } from "@/components/email";
import { Checkbox } from "@/components/elements/Checkbox";
import { emailApi } from "@/api/email/email";
import type { EmailMessage } from "@/types/email/emailMessage";
import type { MailboxType } from "@/components/email/types";
import { showSuccess, showError } from "@/core/toast";
import { useQueryClient } from '@tanstack/react-query';

const EmailDetailView = lazy(() => import("@/components/email").then(mod => ({ default: mod.EmailDetailView })));
const ComposeEmailDialog = lazy(() => import("@/components/email/ComposeEmailDialog").then(mod => ({ default: mod.ComposeEmailDialog })));

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
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mailboxParam = params.get('mailbox') as MailboxType | null;
    if (mailboxParam && ['inbox', 'sent', 'draft', 'starred', 'spam', 'trash'].includes(mailboxParam)) {
      setSelectedMailbox(mailboxParam);
    }
  }, [location.search]);

  const fetchEmails = useCallback(async () => {
    try {
      setLoading(true);
      const statusMap: Record<MailboxType, string | undefined> = {
        inbox: undefined,
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
      showError("خطا در دریافت ایمیل‌ها");
    } finally {
      setLoading(false);
    }
  }, [selectedMailbox, searchQuery]);

  useEffect(() => {
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

    if (email.status === 'new') {
      try {
        await emailApi.markAsRead(email.id);
        setEmails(prev => prev.map(e =>
          e.id === email.id ? { ...e, status: 'read' as const, is_new: false } : e
        ));
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      } catch (error) {
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
      showSuccess("ایمیل با موفقیت حذف شد");
    } catch (error) {
      showError("خطا در حذف ایمیل");
    }
  }, []);

  const handleMarkAsRead = useCallback(async () => {
    if (selectedEmails.size === 0) {
      showError("لطفا ابتدا ایمیل‌هایی را انتخاب کنید");
      return;
    }
    try {
      showSuccess("ایمیل‌ها به عنوان خوانده شده علامت‌گذاری شدند");
      fetchEmails();
      setSelectedEmails(new Set());
    } catch (error) {
      showError("خطا در علامت‌گذاری ایمیل‌ها");
    }
  }, [selectedEmails.size, fetchEmails]);

  const handleMarkAsUnread = useCallback(async () => {
    if (selectedEmails.size === 0) {
      showError("لطفا ابتدا ایمیل‌هایی را انتخاب کنید");
      return;
    }
    try {
      showSuccess("ایمیل‌ها به عنوان نخوانده علامت‌گذاری شدند");
      fetchEmails();
      setSelectedEmails(new Set());
    } catch (error) {
      showError("خطا در علامت‌گذاری ایمیل‌ها");
    }
  }, [selectedEmails.size, fetchEmails]);

  const handleSendEmail = useCallback(async (data: ComposeEmailData) => {
    try {
      if (replyToEmail) {
        await emailApi.markAsReplied(replyToEmail.id, data.message);
        showSuccess("پاسخ با موفقیت ارسال شد");
      } else {
        await emailApi.create({
          name: data.to.split("@")[0],
          email: data.to,
          subject: data.subject,
          message: data.message,
          source: "email",
          status: "new",
        });
        showSuccess("ایمیل با موفقیت ارسال شد");
      }
      setReplyToEmail(null);
      fetchEmails();
    } catch (error: any) {
      const errorMessage = error.message || 'خطا در ارسال ایمیل';
      showError(errorMessage);
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
      showSuccess("پیش‌نویس با موفقیت ذخیره شد");
      fetchEmails();
    } catch (error) {
      showError("خطا در ذخیره پیش‌نویس");
    }
  }, [fetchEmails]);

  const handlePublishDraft = useCallback(async (email: EmailMessage) => {
    try {
      await emailApi.update(email.id, {
        status: "new",
      });
      showSuccess("پیش‌نویس با موفقیت منتشر شد");
      setSelectedEmail(null);
      fetchEmails();
    } catch (error) {
      showError("خطا در انتشار پیش‌نویس");
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
      showSuccess(email.is_starred ? "ستاره حذف شد" : "ستاره اضافه شد");
    } catch (error) {
      showError("خطا در تغییر وضعیت ستاره");
    }
  }, [selectedEmail]);

  const filteredEmails = useMemo(() => {
    switch (selectedMailbox) {
      case "inbox":
        return emails.filter(e =>
          e.status !== 'draft' &&
          e.status !== 'archived' &&
          (e.source === 'website' || e.source === 'mobile_app')
        );
      case "sent":
        return emails.filter(e => e.source === 'email' && e.status !== 'draft');
      case "draft":
        return emails.filter(e => e.status === 'draft' || e.is_draft);
      case "starred":
        return emails.filter(e => e.is_starred === true);
      case "spam":
        return emails.filter(e =>
          e.status === 'archived' && (
            e.subject?.toLowerCase().includes('هرزنامه') ||
            e.subject?.toLowerCase().includes('spam') ||
            e.email?.toLowerCase().includes('spam')
          )
        );
      case "trash":
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
    <div className="flex h-[calc(100vh-4rem-4rem)] bg-card overflow-hidden border shadow-[rgb(0_0_0/2%)_0px_6px_24px_0px,rgb(0_0_0/2%)_0px_0px_0px_1px]">
      <div className="w-64 flex-shrink-0 h-full overflow-hidden bg-card">
        <EmailSidebar
          selectedMailbox={selectedMailbox}
          onMailboxChange={handleMailboxChange}
          onComposeClick={() => setComposeOpen(true)}
          mailboxCounts={mailboxCounts}
        />
      </div>

      <div className="w-[1px] h-full bg-gray-200 flex-shrink-0"></div>

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
            <div className="border-b p-4 flex-shrink-0">
              <div className="flex items-center gap-4">
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
