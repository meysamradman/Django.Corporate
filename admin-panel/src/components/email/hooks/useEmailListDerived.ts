import { useMemo } from "react";
import type { EmailMessage } from "@/types/email/emailMessage";
import type { MailboxType } from "@/components/email/types";

interface UseEmailListDerivedParams {
  emails: EmailMessage[];
  selectedMailbox: MailboxType;
}

export function useEmailListDerived({ emails, selectedMailbox }: UseEmailListDerivedParams) {
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
    filteredEmails,
    mailboxCounts,
  };
}
