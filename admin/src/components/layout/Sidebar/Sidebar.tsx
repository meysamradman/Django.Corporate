"use client";

import {useState, useEffect, useCallback, useMemo} from "react";
import {User, LogOut, Settings} from "lucide-react";
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
import {useMenuData, MenuItem} from "./SidebarMenu";
import {SubMenuItem} from "./SubMenuItem";
import {useAuth} from "@/core/auth/AuthContext";
import {usePathname, useRouter} from "next/navigation";
import {toast} from "@/components/elements/Sonner";
import {msg} from "@/core/messages/message";
import { useAdminStore } from "@/components/layout/Sidebar/stores/sidebarStore";
import { getUserRoleDisplayText } from "@/core/config/roles";


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
                            onContentToggle
                        }: SidebarProps) {
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [activeSubItem, setActiveSubItem] = useState<string | null>(null);
    const {user, logout} = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const menuData = useMenuData();
    const setSelectedItemHasSubMenu = useAdminStore((state) => state.setSelectedItemHasSubMenu);
    const setContentCollapsed = useAdminStore((state) => state.setContentCollapsed);

    const findActiveItem = useCallback((): MenuItem | null => {
        // Early return for common cases
        if (!pathname || !menuData.groups.length) {
            return menuData.groups[0]?.items[0] || null;
        }

        for (const group of menuData.groups) {
            for (const item of group.items) {
                // Check exact match first (fastest - O(1))
                if ('url' in item && item.url === pathname) {
                    return item;
                }
                
                // Check dynamic route match (like /admins/123 with /admins)
                if ('url' in item && item.url && pathname.startsWith(item.url + '/')) {
                    return item;
                }

                // Check submenu items
                if ('items' in item && item.items) {
                    for (const subItem of item.items) {
                        if (subItem.url === pathname) {
                            return item;
                        }
                        
                        // Check dynamic route match for submenu items
                        if (subItem.url && pathname.startsWith(subItem.url + '/')) {
                            return item;
                        }
                    }
                }
            }
        }

        // Fallback to first item if no match found
        return menuData.groups[0]?.items[0] || null;
    }, [pathname, menuData]);

    // Memoize activeItem to prevent unnecessary recalculations
    const activeItem = useMemo(() => findActiveItem(), [findActiveItem]);

    useEffect(() => {
        setSelectedItem(activeItem);
        if (activeItem) {
            const hasSubMenu = Boolean('items' in activeItem && activeItem.items && activeItem.items.length > 0);
            setSelectedItemHasSubMenu(hasSubMenu);
            // Open the content panel if the active item has a submenu
            if (hasSubMenu) {
                setContentCollapsed(false);
            }
        }
    }, [activeItem, setSelectedItemHasSubMenu, setContentCollapsed]);

    const handleIconClick = (item: MenuItem) => {
        setSelectedItem(item);
        const hasSubMenu = Boolean('items' in item && item.items && item.items.length > 0);
        setSelectedItemHasSubMenu(hasSubMenu);

        if (onContentToggle) {
            if (hasSubMenu) {
                if (isContentCollapsed) {
                    onContentToggle();
                }
            } else {
                if (!isContentCollapsed) {
                    onContentToggle();
                }
            }
        }
    };

    const handleProfileClick = () => {
        // Navigate to current admin's profile page
        if (user?.id) {
            router.push(`/admins/${user.id}/edit`);
        } else {
            toast.error("Unable to navigate to profile page");
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            // Don't show toast here - let AuthContext or page handle logout notifications
        } catch (error) {
            console.error("Logout error:", error);
            // Only show error toast if logout fails
            toast.error(msg.error('unauthorized'));
        }
    };

    const sidebarClasses = cn(
        "sidebar",
        "fixed top-0 z-50 h-screen bg-sdb",
        "flex overflow-hidden transition-all duration-300 ease-in-out",
        "lg:z-40",
        "right-0 border-l border-sdb-br",
        isContentCollapsed ? "w-14" : "w-80",
        isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
        className
    );

    const iconStripClasses = cn(
        "sidebar-icons",
        "bg-sidebar flex flex-col w-14 shrink-0",
        "border-l border-sdb-br"
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
                        <NavMain groups={menuData.groups} onIconClick={handleIconClick} onLinkClick={onToggle}/>
                    </nav>
                    <div className="h-16 flex items-center justify-center border-t border-sdb-br">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="flex items-center justify-center h-10 w-10 rounded-md hover:bg-sidebar-hover hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
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
                                            {user?.full_name || user?.profile?.full_name || user?.email || user?.mobile || "کاربر"}
                                        </span>
                                        <span className="text-xs text-muted-foreground mt-1">
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

                                <DropdownMenuItem
                                    className="cursor-pointer"
                                >
                                    <Settings className="h-4 w-4"/>
                                    <span>تنظیمات</span>
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
                            <div className="h-full overflow-x-hidden p-4">
                                {selectedItem && 'items' in selectedItem && selectedItem.items?.length ? (
                                    <div className="space-y-1">
                                        {(
                                            [
                                                ...(selectedItem.title.trim() && 
                                                    !(selectedItem.items && selectedItem.items.length > 0 && selectedItem.items[0]?.isTitle) 
                                                    ? [{title: selectedItem.title, isTitle: true}] 
                                                    : []),
                                                ...(selectedItem.items || []),
                                            ] as MenuItem[]
                                        ).map((subItem, index) => (
                                            <SubMenuItem
                                                key={subItem.title}
                                                item={subItem}
                                                index={index}
                                                isActive={activeSubItem === subItem.title && !('isTitle' in subItem && subItem.isTitle)}
                                                onItemClick={setActiveSubItem}
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
