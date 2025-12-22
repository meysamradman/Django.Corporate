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

const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 1024;
};

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, _get) => ({
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
      version: 4,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
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
      onRehydrateStorage: () => (state, error) => {
        if (error || !state) return;
      },
    }
  )
);

