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

  closedGroups: string[];
  toggleGroup: (groupTitle: string) => void;
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

      closedGroups: [],
      toggleGroup: (groupTitle: string) => set((state) => {
        const isClosed = state.closedGroups.includes(groupTitle);
        return {
          closedGroups: isClosed
            ? state.closedGroups.filter(t => t !== groupTitle)
            : [...state.closedGroups, groupTitle]
        };
      }),
    }),
    {
      name: 'admin-ui-storage',
      version: 5,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        return {
          sidebarOpen: state.sidebarOpen,
          contentCollapsed: state.contentCollapsed,
          selectedItemHasSubMenu: state.selectedItemHasSubMenu,
          closedGroups: state.closedGroups,
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
        if (version < 5) {
          return {
            ...persistedState,
            closedGroups: [],
          }
        }
        return persistedState;
      },
      onRehydrateStorage: () => (state, error) => {
        if (error || !state) return;
      },
    }
  )
);
