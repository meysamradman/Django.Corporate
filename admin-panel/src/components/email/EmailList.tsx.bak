import { EmailItem } from "./EmailItem";
import type { EmailMessage } from "@/types/email/emailMessage";
import { Skeleton } from "@/components/elements/Skeleton";
import { MailQuestion } from "lucide-react";

import type { MailboxType } from "./types";

interface EmailListProps {
  emails: EmailMessage[];
  selectedEmails: Set<number>;
  onSelectEmail: (emailId: number) => void;
  onEmailClick?: (email: EmailMessage) => void;
  onToggleStar?: (email: EmailMessage) => void;
  mailbox?: MailboxType;
  loading?: boolean;
}

export function EmailList({
  emails,
  selectedEmails,
  onSelectEmail,
  onEmailClick,
  onToggleStar,
  mailbox = "inbox",
  loading = false,
}: EmailListProps) {
  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="divide-y divide-border">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="p-4 space-y-3">
              <div className="flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-300">
        <div className="bg-bg p-6 rounded-full mb-4">
          <MailQuestion className="size-12 text-font-s opacity-40" />
        </div>
        <div className="text-center font-medium text-font-s">ایمیلی یافت نشد</div>
        <p className="text-sm text-font-s opacity-60 mt-1">در این بخش در حال حاضر پیامی وجود ندارد</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      <div className="divide-y divide-border">
        {emails.map((email) => (
          <EmailItem
            key={email.id}
            email={email}
            isSelected={selectedEmails.has(email.id)}
            onSelect={onSelectEmail}
            onClick={onEmailClick}
            onToggleStar={mailbox !== "spam" && mailbox !== "trash" ? onToggleStar : undefined}
          />
        ))}
      </div>
    </div>
  );
}

