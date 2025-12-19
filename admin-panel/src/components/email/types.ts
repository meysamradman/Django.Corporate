import type React from 'react';

export type MailboxType = "inbox" | "sent" | "draft" | "starred" | "spam" | "trash";

export type MailboxItem = {
  id: MailboxType;
  label: string;
  icon: React.ReactNode;
  count?: number;
  color?: string;
};

export type Label = {
  id: string;
  name: string;
  color: "green" | "purple" | "orange" | "red";
};

