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
  setContentCollapsed: (collapsed: boolean) => void;
  setSelectedItemHasSubMenu: (hasSubMenu: boolean) => void;
  setPageLoading: (loading: boolean) => void;
  setApiLoading: (loading: boolean) => void;
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      contentCollapsed: true,
      selectedItemHasSubMenu: true,
      isPageLoading: false,
      isApiLoading: false,
      
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleContent: () => set((state) => ({ contentCollapsed: !state.contentCollapsed })),
      setContentCollapsed: (collapsed) => set({ contentCollapsed: collapsed }),
      setSelectedItemHasSubMenu: (hasSubMenu) => set({ selectedItemHasSubMenu: hasSubMenu }),
      setPageLoading: (loading) => set({ isPageLoading: loading }),
      setApiLoading: (loading) => set({ isApiLoading: loading }),
    }),
    {
      name: 'admin-ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        contentCollapsed: state.contentCollapsed,
        selectedItemHasSubMenu: state.selectedItemHasSubMenu,
      }),
    }
  )
);
