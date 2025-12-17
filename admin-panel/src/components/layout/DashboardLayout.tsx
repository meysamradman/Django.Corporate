import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/core/utils/cn';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const [isMounted, setIsMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contentCollapsed, setContentCollapsed] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const prevPathnameRef = React.useRef(location.pathname);
  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 1024;
      const pathnameChanged = prevPathnameRef.current !== location.pathname;
      
      if (pathnameChanged && isMobile && sidebarOpen) {
        setSidebarOpen(false);
      }
      
      prevPathnameRef.current = location.pathname;
    }
  }, [location.pathname, sidebarOpen, isMounted]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleContent = () => {
    setContentCollapsed(!contentCollapsed);
  };

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
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

