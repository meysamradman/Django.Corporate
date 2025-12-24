import { memo, type ReactNode, useMemo } from "react";
import { Card, CardContent } from "@/components/elements/Card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/elements/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/elements/DropdownMenu";
import { MoreVertical } from "lucide-react";
import { cn } from "@/core/utils/cn";

export interface CardItemAction<T = any> {
  label: string | ((item: T) => string);
  icon?: ReactNode;
  onClick: (item: T) => void;
  isDestructive?: boolean;
  isDisabled?: (item: T) => boolean;
}

export interface CardItemProps<T = any> {
  item: T;
  avatar?: {
    src?: string;
    fallback?: string;
    alt?: string;
    className?: string;
  };
  title: string | ((item: T) => string);
  status?: {
    label: string | ((item: T) => string);
    variant?: "green" | "red" | "orange" | "blue" | "purple" | "gray";
  };
  actions?: CardItemAction<T>[];
  content?: ReactNode | ((item: T) => ReactNode);
  footer?: ReactNode | ((item: T) => ReactNode);
  onClick?: (item: T) => void;
  className?: string;
}

const STATUS_CLASSES = {
  green: "bg-green-0 text-green-1",
  red: "bg-red-0 text-red-1",
  orange: "bg-orange-0 text-orange-1",
  blue: "bg-blue-0 text-blue-1",
  purple: "bg-purple-0 text-purple-1",
  gray: "bg-gray-0 text-font-s",
} as const;

function CardItemComponent<T = any>({
  item,
  avatar,
  title,
  status,
  actions,
  content,
  footer,
  onClick,
  className,
}: CardItemProps<T>) {
  const titleText = useMemo(
    () => (typeof title === "function" ? title(item) : title),
    [title, item]
  );

  const statusLabel = useMemo(() => {
    if (!status) return null;
    return typeof status.label === "function" ? status.label(item) : status.label;
  }, [status, item]);

  const statusVariant = status?.variant || "green";

  const availableActions = useMemo(
    () =>
      actions
        ? actions.filter((action) => !action.isDisabled || !action.isDisabled(item))
        : [],
    [actions, item]
  );

  const avatarFallback = avatar?.fallback || "؟";
  const avatarAlt = avatar?.alt || titleText;
  const hasContent = content || footer;

  return (
    <Card
      className={cn(
        "bg-wt rounded-lg shadow-sm border-0",
        onClick && "cursor-pointer hover:shadow-md transition-shadow",
        className
      )}
      onClick={() => onClick?.(item)}
    >
      <CardContent className="px-6 pt-0 pb-0">
        <div className="pt-0">
          <div className="flex items-start justify-between mb-4">
            {statusLabel ? (
              <span
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium",
                  STATUS_CLASSES[statusVariant]
                )}
              >
                {statusLabel}
              </span>
            ) : (
              <div />
            )}

            {availableActions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="flex items-center justify-center size-8 rounded-md bg-gray-0/30 hover:bg-gray-0/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <MoreVertical className="size-4 text-font-s" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[160px]">
                  {availableActions.map((action, index) => {
                    const labelText =
                      typeof action.label === "function"
                        ? action.label(item)
                        : action.label;
                    return (
                      <DropdownMenuItem
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          action.onClick(item);
                        }}
                        className={cn(
                          action.isDestructive && "text-red-1 focus:text-red-1"
                        )}
                      >
                        {action.icon && <span className="ml-2">{action.icon}</span>}
                        {labelText}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="flex flex-col items-center mb-4">
            {avatar && (
              <Avatar className={cn("size-20 rounded-xl mb-3", avatar.className)}>
                {avatar.src ? (
                  <AvatarImage
                    src={avatar.src}
                    alt={avatarAlt}
                    className="rounded-xl"
                  />
                ) : (
                  <AvatarImage
                    src="/images/default_profile.png"
                    alt={avatarAlt}
                    className="rounded-xl"
                  />
                )}
                <AvatarFallback className="bg-gray-0 text-font-p text-xl font-semibold rounded-xl">
                  {avatarFallback}
                </AvatarFallback>
              </Avatar>
            )}
            <h3 className="text-lg font-bold text-font-p">{titleText}</h3>
          </div>
        </div>

        {hasContent && (
          <div className="bg-bg rounded-lg mb-0 p-4 flex flex-col justify-between min-h-[140px]">
            {content && (
              <div>
                {typeof content === "function" ? content(item) : content}
              </div>
            )}

            {footer && (
              <div
                className={cn("space-y-2", content && "mt-3 border-t border-br pt-3")}
              >
                {typeof footer === "function" ? footer(item) : footer}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const CardItem = memo(CardItemComponent) as typeof CardItemComponent;

