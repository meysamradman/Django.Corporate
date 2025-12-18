export type MailboxType = "inbox" | "sent" | "draft" | "starred" | "spam" | "trash";

export interface MailboxItem {
  id: MailboxType;
  label: string;
  icon: React.ReactNode;
  count?: number;
  color?: string;
}

export interface Label {
  id: string;
  name: string;
  color: "green" | "purple" | "orange" | "red";
}

