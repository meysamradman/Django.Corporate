import type { ReactNode } from 'react';

export type MailboxType = "inbox" | "sent" | "draft" | "starred" | "spam" | "trash";

export type MailboxItem = {
  id: MailboxType;
  label: string;
  icon: ReactNode;
  count?: number;
  color?: string;
};

export type Label = {
  id: string;
  name: string;
  color: "green" | "purple" | "orange" | "red";
};

