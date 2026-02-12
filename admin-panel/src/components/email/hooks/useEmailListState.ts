import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import type { EmailMessage } from "@/types/email/emailMessage";
import type { MailboxType } from "@/components/email/types";

interface UseEmailListStateParams {
  emails: EmailMessage[];
}

export function useEmailListState({ emails }: UseEmailListStateParams) {
  const location = useLocation();

  const [selectedMailbox, setSelectedMailbox] = useState<MailboxType>("inbox");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmails, setSelectedEmails] = useState<Set<number>>(new Set());
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [replyToEmail, setReplyToEmail] = useState<EmailMessage | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mailboxParam = params.get("mailbox") as MailboxType | null;
    if (mailboxParam && ["inbox", "sent", "draft", "starred", "spam", "trash"].includes(mailboxParam)) {
      setSelectedMailbox(mailboxParam);
    }
  }, [location.search]);

  const handleMailboxChange = useCallback((mailbox: MailboxType) => {
    setSelectedMailbox(mailbox);
    setSelectedEmails(new Set());
    setSelectedEmail(null);
  }, []);

  const handleSelectEmail = useCallback((emailId: number) => {
    setSelectedEmails((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(emailId)) {
        newSelected.delete(emailId);
      } else {
        newSelected.add(emailId);
      }
      return newSelected;
    });
  }, []);

  const handleSelectAll = useCallback((list: EmailMessage[]) => {
    setSelectedEmails((prev) => {
      const filteredIds = new Set(list.map((item) => item.id));
      const allSelected = list.length > 0 && list.every((item) => prev.has(item.id));
      if (allSelected) {
        return new Set([...prev].filter((id) => !filteredIds.has(id)));
      }
      return new Set([...prev, ...list.map((item) => item.id)]);
    });
  }, []);

  const handleReplyEmail = useCallback((email: EmailMessage) => {
    setReplyToEmail(email);
    setComposeOpen(true);
  }, []);

  const filteredEmails = useMemo(() => {
    switch (selectedMailbox) {
      case "inbox":
        return emails.filter(
          (item) =>
            item.status !== "draft" &&
            item.status !== "archived" &&
            (item.source === "website" || item.source === "mobile_app")
        );
      case "sent":
        return emails.filter((item) => item.source === "email" && item.status !== "draft");
      case "draft":
        return emails.filter((item) => item.status === "draft" || item.is_draft);
      case "starred":
        return emails.filter((item) => item.is_starred === true);
      case "spam":
        return emails.filter(
          (item) =>
            item.status === "archived" &&
            (item.subject?.toLowerCase().includes("هرزنامه") ||
              item.subject?.toLowerCase().includes("spam") ||
              item.email?.toLowerCase().includes("spam"))
        );
      case "trash":
        return emails.filter(
          (item) =>
            item.status === "archived" &&
            (item.subject?.toLowerCase().includes("حذف") ||
              item.subject?.toLowerCase().includes("deleted") ||
              item.email?.toLowerCase().includes("deleted"))
        );
      default:
        return emails;
    }
  }, [emails, selectedMailbox]);

  const mailboxCounts = useMemo(
    () => ({
      inbox: emails.filter(
        (item) =>
          item.status !== "draft" &&
          item.status !== "archived" &&
          (item.source === "website" || item.source === "mobile_app")
      ).length,
      sent: emails.filter((item) => item.source === "email" && item.status !== "draft").length,
      draft: emails.filter((item) => item.status === "draft" || item.is_draft).length,
      starred: emails.filter((item) => item.is_starred === true).length,
      spam: emails.filter(
        (item) =>
          item.status === "archived" &&
          (item.subject?.toLowerCase().includes("هرزنامه") ||
            item.subject?.toLowerCase().includes("spam") ||
            item.email?.toLowerCase().includes("spam"))
      ).length,
      trash: emails.filter(
        (item) =>
          item.status === "archived" &&
          (item.subject?.toLowerCase().includes("حذف") ||
            item.subject?.toLowerCase().includes("deleted") ||
            item.email?.toLowerCase().includes("deleted"))
      ).length,
    }),
    [emails]
  );

  return {
    selectedMailbox,
    searchQuery,
    setSearchQuery,
    selectedEmails,
    setSelectedEmails,
    composeOpen,
    setComposeOpen,
    selectedEmail,
    setSelectedEmail,
    replyToEmail,
    setReplyToEmail,
    handleMailboxChange,
    handleSelectEmail,
    handleSelectAll,
    handleReplyEmail,
    filteredEmails,
    mailboxCounts,
  };
}
