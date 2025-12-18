import {useState, useEffect, useCallback, useMemo} from "react";
import {User, LogOut} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/elements/DropdownMenu";
import {SidebarHeader} from "./SidebarHeader";
import {NavMain} from "./NavMain";
import {NavUser} from "./NavUser";
import {SidebarLogo} from "./SidebarLogo";
import {cn} from "@/core/utils/cn";
import {useMenuData} from "./SidebarMenu";
import type { MenuItem } from '@/types/shared/menu';
import {SubMenuItem} from "./SubMenuItem";
import {useAuth} from "@/core/auth/AuthContext";
import {useLocation, useNavigate} from "react-router-dom";
import {toast} from "@/components/elements/Sonner";
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
  const {user, logout} = useAuth();
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
        if ('url' in item && item.url === pathname) {
          return item;
        }
        
        if ('url' in item && item.url && pathname.startsWith(item.url + '/')) {
          return item;
        }

        if ('items' in item && item.items) {
          for (const subItem of item.items) {
            if (subItem.url === pathname) {
              return item;
            }
            
            if (subItem.url && pathname.startsWith(subItem.url + '/')) {
              return item;
            }
          }
        }
      }
    }

    return menuGroups[0]?.items[0] || null;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeItem, selectedItem, hasUserSelectedItem]);

  const handleIconClick = (item: MenuItem) => {
    setHasUserSelectedItem(true);
    setSelectedItem(item);
    const hasSubMenu = Boolean('items' in item && item.items && item.items.length > 0);
    setSelectedItemHasSubMenu(hasSubMenu);
  };

  const handleProfileClick = () => {
    navigate(`/admins/me/edit`);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      toast.error(getError('unauthorized'));
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
          <SidebarLogo/>
          <nav className="flex-1 overflow-y-auto">
            <NavMain groups={menuGroups} onIconClick={handleIconClick} />
          </nav>
          <div className="h-16 flex items-center justify-center border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center justify-center h-10 w-10 rounded-md text-sdb-menu-txt hover:bg-sdb-hv hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="User menu"
                >
                  <NavUser size="sm"/>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                side="left"
                className="w-56"
              >
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {(user as any)?.full_name || (user as any)?.profile?.full_name || 
                       (user?.first_name && user?.last_name 
                         ? `${user.first_name} ${user.last_name}`
                         : user?.email || user?.mobile || "کاربر")}
                    </span>
                    <span className="text-xs text-font-s mt-1">
                      {getUserRoleDisplayText(user)}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator/>

                <DropdownMenuItem
                  onClick={handleProfileClick}
                  className="cursor-pointer"
                >
                  <User className="h-4 w-4"/>
                  <span>پروفایل</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator/>

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4"/>
                  <span>خروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="sidebar-content flex-1 flex flex-col min-w-0">
          <SidebarHeader
            selectedItem={selectedItem}
          />
          <div className={cn(
            "flex-1 overflow-hidden transition-opacity duration-200 ease-out",
            isContentCollapsed ? "opacity-0" : "opacity-100"
          )}>
            {!isContentCollapsed && (
              <div className="h-full overflow-x-hidden p-4 overflow-y-auto">
                {selectedItem && 'items' in selectedItem && selectedItem.items?.length ? (
                  <div className="space-y-1">
                    {(
                      [
                        ...(selectedItem.items && selectedItem.items.length > 0 && 
                          !selectedItem.items[0]?.isTitle && 
                          selectedItem.title.trim()
                          ? [{title: selectedItem.title, isTitle: true}] 
                          : []),
                        ...(selectedItem.items || []),
                      ] as MenuItem[]
                    ).map((subItem, index) => (
                      <SubMenuItem
                        key={`${subItem.title}-${index}`}
                        item={subItem}
                        index={index}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

