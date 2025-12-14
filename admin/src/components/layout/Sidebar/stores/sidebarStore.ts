import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AdminStore {
  sidebarOpen: boolean;
  contentCollapsed: boolean;
  selectedItemHasSubMenu: boolean;
  isPageLoading: boolean;
  isApiLoading: boolean;
  
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleContent: () => void;
  setSelectedItemHasSubMenu: (hasSubMenu: boolean) => void;
  setPageLoading: (loading: boolean) => void;
  setApiLoading: (loading: boolean) => void;
}

// تابع کمکی برای تشخیص موبایل
const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 1024; // lg breakpoint
};

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      // مقدار پیش‌فرض: در SSR همیشه false (برای جلوگیری از hydration mismatch)
      sidebarOpen: false,
      contentCollapsed: false,
      selectedItemHasSubMenu: true,
      isPageLoading: false,
      isApiLoading: false,
      
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleContent: () => set((state) => ({ contentCollapsed: !state.contentCollapsed })),
      setSelectedItemHasSubMenu: (hasSubMenu) => set({ selectedItemHasSubMenu: hasSubMenu }),
      setPageLoading: (loading) => set({ isPageLoading: loading }),
      setApiLoading: (loading) => set({ isApiLoading: loading }),
    }),
    {
      name: 'admin-ui-storage',
      version: 4, // افزایش version برای reset کردن localStorage قدیمی
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        // در موبایل، sidebarOpen را persist نکنیم - همیشه false باشد
        // فقط در desktop sidebarOpen را persist می‌کنیم
        const shouldPersistSidebar = typeof window !== 'undefined' && !isMobileDevice();
        return {
          ...(shouldPersistSidebar && { sidebarOpen: state.sidebarOpen }),
          contentCollapsed: state.contentCollapsed,
          selectedItemHasSubMenu: state.selectedItemHasSubMenu,
        };
      },
      migrate: (persistedState: any, version: number) => {
        if (version < 4) {
          return {
            ...persistedState,
            contentCollapsed: false,
            sidebarOpen: typeof window !== 'undefined' && !isMobileDevice() ? (persistedState?.sidebarOpen ?? true) : false,
          };
        }
        return persistedState;
      },
      onRehydrateStorage: () => (state) => {
        // بعد از rehydrate، مقدار صحیح را تنظیم کنیم (فقط یک بار در rehydrate)
        if (typeof window !== 'undefined' && state) {
          const isMobile = isMobileDevice();
          if (isMobile) {
            // در موبایل همیشه بسته (فقط در rehydrate - نه بعد از toggle)
            if (state.sidebarOpen !== false) {
              state.setSidebarOpen(false);
            }
          } else {
            // در desktop، مقدار از persist شده استفاده می‌شود
            if (state.sidebarOpen === false) {
              state.setSidebarOpen(true);
            }
          }
        }
      },
    }
  )
);
