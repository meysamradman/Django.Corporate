import { useState, useEffect, lazy } from "react";

import { EmailSidebar, EmailList, EmailSearch, EmailToolbar, type ComposeEmailData } from "@/components/email";
import { Checkbox } from "@/components/elements/Checkbox";
import type { EmailMessage } from "@/types/email/emailMessage";
import { MessagingLayout } from "@/components/templates/MessagingLayout";
import { useEmailListState } from "@/components/email/hooks/useEmailListState";
import { useEmailListActions } from "@/components/email/hooks/useEmailListActions";

const EmailDetailView = lazy(() => import("@/components/email").then(mod => ({ default: mod.EmailDetailView })));
const ComposeEmailDialog = lazy(() => import("@/components/email/EmailComposeDialog.tsx").then(mod => ({ default: mod.EmailComposeDialog })));

export default function EmailPage() {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const {
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
  } = useEmailListState({ emails });

  const {
    fetchEmails,
    handleEmailClick,
    handleDeleteEmail,
    handleMarkAsRead,
    handleMarkAsUnread,
    handleSendEmail,
    handleSaveDraft,
    handlePublishDraft,
    handleToggleStar,
  } = useEmailListActions({
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
  });

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  return (
    <MessagingLayout
      sidebar={
        <EmailSidebar
          selectedMailbox={selectedMailbox}
          onMailboxChange={handleMailboxChange}
          onComposeClick={() => setComposeOpen(true)}
          mailboxCounts={mailboxCounts}
        />
      }
      toolbar={!selectedEmail && (
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
      )}
      dialogs={
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
      }
    >
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
        <EmailList
          emails={filteredEmails}
          selectedEmails={selectedEmails}
          onSelectEmail={handleSelectEmail}
          onEmailClick={handleEmailClick}
          onToggleStar={handleToggleStar}
          mailbox={selectedMailbox}
          loading={loading}
        />
      )}
    </MessagingLayout>
  );
}
