import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { emailApi } from "@/api/email/email";
import type { EmailMessage } from "@/types/email/emailMessage";
import type { MailboxType } from "@/components/email/types";
import type { ComposeEmailData } from "@/components/email";
import { notifyApiError, showSuccess, showError } from "@/core/toast";

interface UseEmailListActionsParams {
  selectedMailbox: MailboxType;
  searchQuery: string;
  selectedEmails: Set<number>;
  selectedEmail: EmailMessage | null;
  replyToEmail: EmailMessage | null;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setEmails: Dispatch<SetStateAction<EmailMessage[]>>;
  setSelectedEmail: Dispatch<SetStateAction<EmailMessage | null>>;
  setSelectedEmails: Dispatch<SetStateAction<Set<number>>>;
  setReplyToEmail: Dispatch<SetStateAction<EmailMessage | null>>;
}

export function useEmailListActions({
  selectedMailbox,
  searchQuery,
  selectedEmails,
  selectedEmail,
  replyToEmail,
  setLoading,
  setEmails,
  setSelectedEmail,
  setSelectedEmails,
  setReplyToEmail,
}: UseEmailListActionsParams) {
  const queryClient = useQueryClient();

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
      notifyApiError(error, {
        fallbackMessage: "خطا در دریافت ایمیل‌ها",
        dedupeKey: "email-fetch-list-error",
        preferBackendMessage: false,
      });
    } finally {
      setLoading(false);
    }
  }, [selectedMailbox, searchQuery, setEmails, setLoading]);

  const handleEmailClick = useCallback(
    async (email: EmailMessage) => {
      setSelectedEmail(email);

      if (email.status === "new") {
        try {
          await emailApi.markAsRead(email.id);
          setEmails((prev) =>
            prev.map((item) =>
              item.id === email.id ? { ...item, status: "read" as const, is_new: false } : item
            )
          );
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        } catch {
        }
      }
    },
    [queryClient, setEmails, setSelectedEmail]
  );

  const handleDeleteEmail = useCallback(
    async (email: EmailMessage) => {
      try {
        setEmails((prev) => prev.filter((item) => item.id !== email.id));
        setSelectedEmail(null);
        showSuccess("ایمیل با موفقیت حذف شد");
      } catch (error) {
        notifyApiError(error, {
          fallbackMessage: "خطا در حذف ایمیل",
          dedupeKey: "email-delete-error",
          preferBackendMessage: false,
        });
      }
    },
    [setEmails, setSelectedEmail]
  );

  const handleMarkAsRead = useCallback(async () => {
    if (selectedEmails.size === 0) {
      showError("لطفا ابتدا ایمیل‌هایی را انتخاب کنید");
      return;
    }
    try {
      showSuccess("ایمیل‌ها به عنوان خوانده شده علامت‌گذاری شدند");
      await fetchEmails();
      setSelectedEmails(new Set());
    } catch (error) {
      notifyApiError(error, {
        fallbackMessage: "خطا در علامت‌گذاری ایمیل‌ها",
        dedupeKey: "email-mark-read-error",
        preferBackendMessage: false,
      });
    }
  }, [selectedEmails.size, fetchEmails, setSelectedEmails]);

  const handleMarkAsUnread = useCallback(async () => {
    if (selectedEmails.size === 0) {
      showError("لطفا ابتدا ایمیل‌هایی را انتخاب کنید");
      return;
    }
    try {
      showSuccess("ایمیل‌ها به عنوان نخوانده علامت‌گذاری شدند");
      await fetchEmails();
      setSelectedEmails(new Set());
    } catch (error) {
      notifyApiError(error, {
        fallbackMessage: "خطا در علامت‌گذاری ایمیل‌ها",
        dedupeKey: "email-mark-unread-error",
        preferBackendMessage: false,
      });
    }
  }, [selectedEmails.size, fetchEmails, setSelectedEmails]);

  const handleSendEmail = useCallback(
    async (data: ComposeEmailData) => {
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
        await fetchEmails();
      } catch (error) {
        notifyApiError(error, {
          fallbackMessage: "خطا در ارسال ایمیل",
          dedupeKey: "email-send-error",
          preferBackendMessage: true,
        });
      }
    },
    [fetchEmails, replyToEmail, setReplyToEmail]
  );

  const handleSaveDraft = useCallback(
    async (data: ComposeEmailData) => {
      try {
        await emailApi.saveDraft({
          name: data.to.split("@")[0] || "بدون نام",
          email: data.to || "draft@example.com",
          subject: data.subject || "پیش‌نویس بدون موضوع",
          message: data.message || "",
          source: "email",
        });
        showSuccess("پیش‌نویس با موفقیت ذخیره شد");
        await fetchEmails();
      } catch (error) {
        notifyApiError(error, {
          fallbackMessage: "خطا در ذخیره پیش‌نویس",
          dedupeKey: "email-save-draft-error",
          preferBackendMessage: false,
        });
      }
    },
    [fetchEmails]
  );

  const handlePublishDraft = useCallback(
    async (email: EmailMessage) => {
      try {
        await emailApi.update(email.id, {
          status: "new",
        });
        showSuccess("پیش‌نویس با موفقیت منتشر شد");
        setSelectedEmail(null);
        await fetchEmails();
      } catch (error) {
        notifyApiError(error, {
          fallbackMessage: "خطا در انتشار پیش‌نویس",
          dedupeKey: "email-publish-draft-error",
          preferBackendMessage: false,
        });
      }
    },
    [fetchEmails, setSelectedEmail]
  );

  const handleToggleStar = useCallback(
    async (email: EmailMessage) => {
      try {
        await emailApi.toggleStar(email.id);
        const updatedEmail = { ...email, is_starred: !email.is_starred };
        setEmails((prev) => prev.map((item) => (item.id === email.id ? updatedEmail : item)));
        if (selectedEmail?.id === email.id) {
          setSelectedEmail(updatedEmail);
        }
        showSuccess(email.is_starred ? "ستاره حذف شد" : "ستاره اضافه شد");
      } catch (error) {
        notifyApiError(error, {
          fallbackMessage: "خطا در تغییر وضعیت ستاره",
          dedupeKey: "email-toggle-star-error",
          preferBackendMessage: false,
        });
      }
    },
    [selectedEmail, setEmails, setSelectedEmail]
  );

  return {
    fetchEmails,
    handleEmailClick,
    handleDeleteEmail,
    handleMarkAsRead,
    handleMarkAsUnread,
    handleSendEmail,
    handleSaveDraft,
    handlePublishDraft,
    handleToggleStar,
  };
}
