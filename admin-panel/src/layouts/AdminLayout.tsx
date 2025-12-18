import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar/Sidebar';
import { Header } from '@/components/layout/Header/Header';
import { PageSkeleton } from '@/lib/loaders';
import { cn } from '@/core/utils/cn';
import { useAdminStore } from '@/components/layout/Sidebar/stores/sidebarStore';
import { useAuth } from '@/core/auth/AuthContext';

/**
 * 🎯 AdminLayout - Layout اصلی پنل ادمین
 * 
 * ✅ مسئولیت‌ها:
 * - مدیریت Sidebar (باز/بسته، collapsed/expanded)
 * - نمایش Header ثابت
 * - مدیریت responsive (موبایل/دسکتاپ)
 * - نمایش PageLoader در حالت بارگذاری auth
 * - رندر محتوای صفحات از طریق Outlet
 * 
 * ✅ رفتار:
 * - Sidebar و Header همیشه نمایش داده میشه (حتی در حالت بارگذاری)
 * - فقط محتوای داخلی در حالت loading، skeleton نشون میده
 * - این باعث میشه فلش سفید نداشته باشیم
 */
export function AdminLayout() {
  const location = useLocation();
  const { isLoading } = useAuth();
  const {
    sidebarOpen,
    contentCollapsed,
    selectedItemHasSubMenu,
    toggleSidebar,
    toggleContent,
    setSidebarOpen
  } = useAdminStore();

  const hasInitializedRef = React.useRef(false);

  // 🎯 مقداردهی اولیه: در دسکتاپ sidebar باز باشه
  useEffect(() => {
    if (typeof window !== 'undefined' && !hasInitializedRef.current) {
      const isMobile = window.innerWidth < 1024;
      if (!isMobile && !sidebarOpen) {
        setSidebarOpen(true);
      }
      hasInitializedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🎯 بستن خودکار sidebar در موبایل هنگام تغییر route
  const prevPathnameRef = React.useRef(location.pathname);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 1024;
      const pathnameChanged = prevPathnameRef.current !== location.pathname;
      
      if (pathnameChanged && isMobile && sidebarOpen) {
        setSidebarOpen(false);
      }
      
      prevPathnameRef.current = location.pathname;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 🎯 Sidebar - ثابت و همیشه موجود */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        isContentCollapsed={contentCollapsed}
        onContentToggle={toggleContent}
      />

      {/* 🎯 Main Content Area */}
      <div className={cn(
        "flex flex-col flex-1 min-w-0 transition-all duration-300",
        contentCollapsed ? "lg:mr-14" : "lg:mr-80"
      )}>
        {/* 🎯 Header - ثابت و همیشه موجود */}
        <Header
          onMenuClick={toggleSidebar}
          isContentCollapsed={contentCollapsed}
          onContentToggle={toggleContent}
          hasSubMenu={selectedItemHasSubMenu}
        />

        {/* 🎯 Page Content - فقط این بخش تغییر می‌کنه */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
          <div className="p-4 sm:p-6 lg:p-8 min-w-0">
            {isLoading ? <PageSkeleton /> : <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}
