import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar/Sidebar';
import { Header } from '@/components/layout/Header/Header';
import { PageSkeleton } from '@/lib/loaders';
import { cn } from '@/core/utils/cn';
import { useAdminStore } from '@/components/layout/Sidebar/stores/sidebarStore';
import { useAuth } from '@/core/auth/AuthContext';
import { RoutePermissionGuard } from '@/components/admins/permissions';
import { FloatingAIChat } from '@/components/ai/chat/FloatingAIChat';


export function AdminLayout() {
  const location = useLocation();
  const { isLoading } = useAuth();
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
          <div className="p-4 sm:p-6 lg:p-8 min-w-0">
            {isLoading ? (
              <PageSkeleton />
            ) : (
              <RoutePermissionGuard>
                <Outlet />
              </RoutePermissionGuard>
            )}
          </div>
        </main>
        <FloatingAIChat />
      </div>
    </div>
  );
}
