import { useState, useEffect, useCallback, useMemo } from "react";
import { User, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/elements/DropdownMenu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/elements/Collapsible";
import { SidebarHeader } from "./SidebarHeader";
import { NavMain } from "./NavMain";
import { NavUser } from "./NavUser";
import { SidebarLogo } from "./SidebarLogo";
import { cn } from "@/core/utils/cn";
import { useMenuData } from "./SidebarMenu";
import type { MenuItem } from '@/types/shared/menu';
import { SubMenuItem } from "./SubMenuItem";
import { useAuth } from "@/core/auth/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { showError } from "@/core/toast";
import { getError } from "@/core/messages/errors";
import { useAdminStore } from "./stores/sidebarStore";
import { getUserRoleDisplayText } from "@/core/permissions/config/roles";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
  isContentCollapsed?: boolean;
  onContentToggle?: () => void;
}

export function Sidebar({
  isOpen,
  onToggle,
  className,
  isContentCollapsed = false,
  onContentToggle: _onContentToggle
}: SidebarProps) {
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [hasUserSelectedItem, setHasUserSelectedItem] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();
  const menuData = useMenuData();
  const setSelectedItemHasSubMenu = useAdminStore((state) => state.setSelectedItemHasSubMenu);

  const menuGroups = menuData.groups;

  const findActiveItem = useCallback((): MenuItem | null => {
    if (!pathname || !menuGroups.length) {
      return menuGroups[0]?.items[0] || null;
    }

    for (const group of menuGroups) {
      for (const item of group.items) {
        if ('url' in item && item.url && item.url === pathname) {
          return item;
        }
      }
    }

    let bestMatch: MenuItem | null = null;
    let bestMatchLength = 0;
    let bestMatchPriority = 0;

    for (const group of menuGroups) {
      for (const item of group.items) {
        if ('items' in item && item.items) {
          const hasMainUrl = 'url' in item && item.url;

          if (hasMainUrl && 'url' in item && item.url === pathname) {
            continue;
          }

          for (const subItem of item.items) {
            if (!subItem.url) continue;

            let matchFound = false;
            let matchLength = 0;

            if (subItem.url === pathname) {
              matchFound = true;
              matchLength = subItem.url.length;
            }

            else if (pathname.startsWith(subItem.url + '/')) {
              matchFound = true;
              matchLength = subItem.url.length;
            }

            if (matchFound) {

              const isExactMatch = subItem.url === pathname;
              const priority = (isExactMatch ? 100 : 50) + (hasMainUrl ? 0 : 25);

              if (!bestMatch || priority > bestMatchPriority ||
                (priority === bestMatchPriority && matchLength > bestMatchLength)) {
                bestMatch = item;
                bestMatchLength = matchLength;
                bestMatchPriority = priority;
              }
            }
          }
        }
      }
    }

    if (bestMatch) {
      return bestMatch;
    }

    for (const group of menuGroups) {
      for (const item of group.items) {
        if ('url' in item && item.url && item.url !== '/' && pathname.startsWith(item.url + '/')) {
          const matchLength = item.url.length;
          if (matchLength > bestMatchLength) {
            bestMatch = item;
            bestMatchLength = matchLength;
          }
        }
      }
    }

    return bestMatch || menuGroups[0]?.items[0] || null;
  }, [pathname, menuGroups]);

  const activeItem = useMemo(() => findActiveItem(), [findActiveItem]);

  useEffect(() => {
    setHasUserSelectedItem(false);
  }, [pathname]);

  useEffect(() => {
    if (hasUserSelectedItem) {
      return;
    }

    if (!activeItem) {
      return;
    }

    const isSameItem =
      selectedItem?.title === activeItem.title &&
      selectedItem?.url === activeItem.url;

    if (isSameItem) {
      const hasSubMenu = Boolean('items' in activeItem && activeItem.items && activeItem.items.length > 0);
      setSelectedItemHasSubMenu(hasSubMenu);
      return;
    }

    setSelectedItem(activeItem);
    const hasSubMenu = Boolean('items' in activeItem && activeItem.items && activeItem.items.length > 0);
    setSelectedItemHasSubMenu(hasSubMenu);
  }, [activeItem, selectedItem, hasUserSelectedItem]);

  const handleIconClick = (item: MenuItem) => {
    setHasUserSelectedItem(true);
    setSelectedItem(item);
    const hasSubMenu = Boolean('items' in item && item.items && item.items.length > 0);
    setSelectedItemHasSubMenu(hasSubMenu);

    if (isContentCollapsed && hasSubMenu && _onContentToggle) {
      _onContentToggle();
    }
  };

  const handleProfileClick = () => {
    navigate(`/admins/me/edit`);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      showError(getError('unauthorized'));
    }
  };

  const sidebarClasses = cn(
    "sidebar",
    "fixed top-0 z-50 h-screen bg-sdb",
    "flex overflow-hidden transition-all duration-300 ease-in-out",
    "lg:z-40",
    "right-0 border-l",
    isContentCollapsed ? "w-14" : "w-80",
    isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
    className
  );

  const iconStripClasses = cn(
    "bg-sdb-ic-bg",
    "flex flex-col w-14 shrink-0",
    "border-l"
  );

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}
      <aside className={sidebarClasses}>
        <div className={iconStripClasses}>
          <SidebarLogo />
          <nav className="flex-1 overflow-y-auto">
            <NavMain groups={menuGroups} onIconClick={handleIconClick} selectedItem={selectedItem} />
          </nav>
          <div className="h-16 flex items-center justify-center border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center justify-center h-10 w-10 rounded-md text-sdb-menu-txt hover:bg-sdb-hv hover:text-primary transition-colors"
                  aria-label="User menu"
                >
                  <NavUser size="sm" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                side="left"
                className="w-72 p-0 overflow-hidden border-br shadow-xl bg-white"
              >
                <div className="flex items-center justify-between p-4 border-b border-br/60 bg-white">
                  <div className="flex items-center gap-3">
                    <NavUser size="sm" />
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-font-p leading-tight">
                        {user?.profile?.full_name || user?.full_name || user?.mobile || "کاربر"}
                      </span>
                      <span className="text-[11px] text-font-s font-medium mt-1">
                        {getUserRoleDisplayText(user).split('|')[0].trim()}
                      </span>
                    </div>
                  </div>
                  <div className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md">
                    {user?.user_role_type === 'consultant' ? 'مشاور' : 'ادمین'}
                  </div>
                </div>

                <div className="py-2">
                  <DropdownMenuItem
                    onClick={handleProfileClick}
                    className="cursor-pointer group py-2.5 px-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-font-s/70 group-hover:text-font-p transition-colors" />
                      <span className="text-[13px] font-medium">پروفایل من</span>
                    </div>
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="mx-0" />

                <div className="p-3">
                  <button
                    onClick={handleLogout}
                    className="w-full py-2 px-4 border border-br rounded-lg text-[13px] font-bold text-font-p hover:bg-gray-50 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                  >
                    خروج از حساب
                  </button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className={cn(
          "sidebar-content flex-1 flex flex-col min-w-0",
          isContentCollapsed && "hidden"
        )}>
          <SidebarHeader
            selectedItem={selectedItem}
            isContentCollapsed={isContentCollapsed}
            onContentToggle={_onContentToggle}
          />
          <div className="flex-1 overflow-hidden p-4 overflow-y-auto">
            {selectedItem && 'items' in selectedItem && selectedItem.items?.length ? (
              <MenuItemsList items={selectedItem.items} />
            ) : null}
          </div>
        </div>
      </aside>
    </>
  );
}

interface MenuItemsListProps {
  items: MenuItem[];
}

function MenuItemsList({ items }: MenuItemsListProps) {
  const groupedItems = useMemo(() => {
    const groups: Array<{ title?: string; items: MenuItem[] }> = [];
    let currentGroup: { title?: string; items: MenuItem[] } | null = null;

    items.forEach((item, index) => {
      if (item.isTitle) {
        if (currentGroup) {
          groups.push(currentGroup);
        }
        currentGroup = { title: item.title, items: [] };
      } else {
        if (!currentGroup) {
          currentGroup = { items: [] };
        }
        currentGroup.items.push(item);
      }

      if (index === items.length - 1 && currentGroup) {
        groups.push(currentGroup);
      }
    });

    return groups;
  }, [items]);

  const closedGroups = useAdminStore((state) => state.closedGroups);
  const toggleGroup = useAdminStore((state) => state.toggleGroup);

  return (
    <div className="space-y-1">
      {groupedItems.map((group, groupIndex) => {
        const hasTitle = !!group.title;
        const groupKey = group.title || `group-${groupIndex}`;
        const isOpen = !closedGroups.includes(groupKey);

        if (!hasTitle && group.items.length > 0) {
          const prevGroup = groupIndex > 0 ? groupedItems[groupIndex - 1] : null;
          const shouldShowSeparator = prevGroup && (prevGroup.items.length > 0 || prevGroup.title);

          return (
            <div key={groupKey} className="space-y-1">
              {shouldShowSeparator && (
                <div className="h-px bg-br my-2 -mx-4" />
              )}
              {group.items.map((item, itemIndex) => {
                let prevNonTitleIndex = -1;
                for (let i = itemIndex - 1; i >= 0; i--) {
                  if (!group.items[i].isTitle) {
                    prevNonTitleIndex = i;
                    break;
                  }
                }
                const shouldShowItemSeparator = item.isTitle && prevNonTitleIndex !== -1;

                return (
                  <SubMenuItem
                    key={`${item.title}-${itemIndex}`}
                    item={item}
                    index={itemIndex}
                    showSeparator={shouldShowItemSeparator}
                  />
                );
              })}
            </div>
          );
        }

        if (!hasTitle || group.items.length === 0) {
          return null;
        }

        const prevGroup = groupIndex > 0 ? groupedItems[groupIndex - 1] : null;
        const shouldShowSeparator = prevGroup && (prevGroup.items.length > 0 || prevGroup.title);

        return (
          <Collapsible
            key={groupKey}
            open={isOpen}
            onOpenChange={() => toggleGroup(groupKey)}
            className="space-y-1"
          >
            {shouldShowSeparator && (
              <div className="h-px bg-br my-2 -mx-4" />
            )}
            <CollapsibleTrigger asChild>
              <button
                className={cn(
                  "flex items-center justify-between w-full px-3 py-2 text-sm font-semibold rounded-md transition-colors",
                  "text-sdb-menu-ttl hover:bg-sdb-hv hover:text-primary",
                  "cursor-pointer"
                )}
              >
                <span>{group.title}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200",
                    isOpen && "rotate-180"
                  )}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent
              className={cn(
                "overflow-hidden",
                "data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down",
                "transition-all duration-200 ease-in-out"
              )}
            >
              <div className="space-y-1 pt-2 pb-1">
                {group.items.map((item, itemIndex) => {
                  let prevNonTitleIndex = -1;
                  for (let i = itemIndex - 1; i >= 0; i--) {
                    if (!group.items[i].isTitle) {
                      prevNonTitleIndex = i;
                      break;
                    }
                  }
                  const shouldShowItemSeparator = item.isTitle && prevNonTitleIndex !== -1;

                  return (
                    <SubMenuItem
                      key={`${item.title}-${itemIndex}`}
                      item={item}
                      index={itemIndex}
                      showSeparator={shouldShowItemSeparator}
                    />
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}

