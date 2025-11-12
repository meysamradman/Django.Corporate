"use client";

import React from "react";
import { EmailItem } from "./EmailItem";
import { EmailMessage } from "@/api/email/route";
import { cn } from "@/core/utils/cn";

import { MailboxType } from "./types";

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
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-font-s">در حال بارگذاری...</div>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-font-s">ایمیل‌ای یافت نشد</div>
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

