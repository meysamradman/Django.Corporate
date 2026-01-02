import { Button } from "@/components/elements/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/elements/DropdownMenu";
import {
  MoreVertical,
  RefreshCw,
  Mail,
  MailOpen,
} from "lucide-react";
import { showError } from "@/core/toast";
import { usePermission } from "@/core/permissions";
import { PERMISSIONS } from "@/core/permissions/constants";
import { ProtectedButton } from "@/core/permissions/components/ProtectedButton";
import type { MailboxType } from "./types";

interface EmailToolbarProps {
  selectedCount?: number;
  totalCount?: number;
  onSelectAll?: () => void;
  onRefresh?: () => void;
  onMarkAsRead?: () => void;
  onMarkAsUnread?: () => void;
  mailbox?: MailboxType;
}

export function EmailToolbar({
  onRefresh,
  onMarkAsRead,
  onMarkAsUnread,
  mailbox = "inbox",
}: EmailToolbarProps) {
  const showReadUnreadActions = mailbox === "inbox";

  return (
    <>
      <ProtectedButton 
        variant="outline" 
        size="icon" 
        onClick={onRefresh}
        permission="email.read"
        showDenyToast={false}
      >
        <RefreshCw className="size-4" />
      </ProtectedButton>
      
      {showReadUnreadActions && (
        <EmailActionsDropdown
          onMarkAsRead={onMarkAsRead}
          onMarkAsUnread={onMarkAsUnread}
        />
      )}
    </>
  );
}

function EmailActionsDropdown({
  onMarkAsRead,
  onMarkAsUnread,
}: {
  onMarkAsRead?: () => void;
  onMarkAsUnread?: () => void;
}) {
  const { hasPermission } = usePermission();
  const canUpdate = hasPermission(PERMISSIONS.EMAIL.UPDATE);

  const handleClick = (callback?: () => void) => {
    if (!canUpdate) {
      showError("شما دسترسی تغییر وضعیت ایمیل ندارید");
      return;
    }
    callback?.();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          disabled={!canUpdate}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleClick(onMarkAsRead)}>
          <MailOpen className="size-4" />
          <span>خوانده شده</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleClick(onMarkAsUnread)}>
          <Mail className="size-4" />
          <span>نخوانده شده</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

