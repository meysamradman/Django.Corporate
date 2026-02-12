import { useEffect } from "react";
import { useGlobalDrawerStore } from "@/components/shared/drawer/store";
import type { DrawerId } from "@/components/shared/drawer/types";

interface DrawerActionConfig {
  drawerId: DrawerId;
  withEditId?: boolean;
}

interface UseOpenDrawerFromUrlActionParams {
  searchParams: URLSearchParams;
  actionMap: Record<string, DrawerActionConfig>;
}

export function useOpenDrawerFromUrlAction({ searchParams, actionMap }: UseOpenDrawerFromUrlActionParams) {
  const openDrawer = useGlobalDrawerStore((state) => state.open);

  useEffect(() => {
    const action = searchParams.get("action");
    if (!action) return;

    const config = actionMap[action];
    if (!config) return;

    if (config.withEditId) {
      const id = searchParams.get("id");
      const editId = id ? Number(id) : NaN;
      if (!Number.isFinite(editId)) return;
      openDrawer(config.drawerId, { editId } as any);
      return;
    }

    openDrawer(config.drawerId);
  }, [searchParams, actionMap, openDrawer]);
}
