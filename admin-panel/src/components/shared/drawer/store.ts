import { create } from 'zustand';
import type { DrawerId, DrawerProps } from './types';

interface GlobalDrawerStore {
    activeDrawer: DrawerId | null;
    drawerProps: any; // Type-safe wrapper handles casting
    open: <T extends DrawerId>(id: T, props?: DrawerProps[T]) => void;
    close: () => void;
}

export const useGlobalDrawerStore = create<GlobalDrawerStore>((set) => ({
    activeDrawer: null,
    drawerProps: {},
    open: (id, props) => set({ activeDrawer: id, drawerProps: props || {} }),
    close: () => set({ activeDrawer: null, drawerProps: {} }),
}));
