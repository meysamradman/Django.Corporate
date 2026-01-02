import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar/Sidebar';
import { Header } from '@/components/layout/Header/Header';
import { cn } from '@/core/utils/cn';
import { useAdminStore } from '@/components/layout/Sidebar/stores/sidebarStore';
import { RoutePermissionGuard } from '@/core/permissions';
import { FloatingAIChat } from '@/components/ai/chat/FloatingAIChat';
import { FaviconManager } from '@/components/panel/FaviconManager';


export function AdminLayout() {
  const location = useLocation();
  const {
    sidebarOpen,
    contentCollapsed,
    toggleSidebar,
    toggleContent,
    setSidebarOpen
  } = useAdminStore();

  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !hasInitializedRef.current) {
      const isMobile = window.innerWidth < 1024;
      if (!isMobile && !sidebarOpen) {
        setSidebarOpen(true);
      }
      hasInitializedRef.current = true;
    }
  }, [sidebarOpen, setSidebarOpen]);

  const prevPathnameRef = useRef(location.pathname);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 1024;
      const pathnameChanged = prevPathnameRef.current !== location.pathname;

      if (pathnameChanged && isMobile && sidebarOpen) {
        setSidebarOpen(false);
      }

      prevPathnameRef.current = location.pathname;
    }
  }, [location.pathname, sidebarOpen, setSidebarOpen]);

  return (
    <>
      <FaviconManager />
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={toggleSidebar}
          isContentCollapsed={contentCollapsed}
          onContentToggle={toggleContent}
        />
        <div className={cn(
          "flex flex-col flex-1 min-w-0 transition-all duration-300",
          contentCollapsed ? "lg:mr-14" : "lg:mr-80"
        )}>
          <Header
            onMenuClick={toggleSidebar}
            isContentCollapsed={contentCollapsed}
            onContentToggle={toggleContent}
          />
          <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
            <div className="p-4 lg:p-6 min-w-0">
              <RoutePermissionGuard>
                <Outlet />
              </RoutePermissionGuard>
            </div>
          </main>
          <FloatingAIChat />
        </div>
      </div>
    </>
  );
}
