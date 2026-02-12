import { useState } from "react";
import { useTableFilters } from "@/components/tables/utils/useTableFilters";
import { useURLStateSync, parseBooleanParam, parseDateRange } from "@/hooks/useURLStateSync";
import { initSortingFromURL } from "@/components/tables/utils/tableSorting";
import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import type { TablePaginationState } from "@/types/shared/pagination";

interface RoleListFilters extends Record<string, unknown> {
  is_active?: boolean;
  is_system_role?: boolean;
  date_from?: string;
  date_to?: string;
}

export function useRolesListTableState() {
  const [pagination, setPagination] = useState<TablePaginationState>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const page = parseInt(urlParams.get("page") || "1", 10);
      const size = parseInt(urlParams.get("size") || "10", 10);
      return { pageIndex: Math.max(0, page - 1), pageSize: size };
    }
    return { pageIndex: 0, pageSize: 10 };
  });

  const [sorting, setSorting] = useState<SortingState>(() => initSortingFromURL());
  const [rowSelection, setRowSelection] = useState({});
  const [searchValue, setSearchValue] = useState(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get("search") || "";
    }
    return "";
  });

  const [clientFilters, setClientFilters] = useState<RoleListFilters>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const filters: RoleListFilters = {};
      const isActive = urlParams.get("is_active");
      if (isActive !== null) filters.is_active = isActive === "true";
      const isSystemRole = urlParams.get("is_system_role");
      if (isSystemRole !== null) filters.is_system_role = isSystemRole === "true";
      if (urlParams.get("date_from")) filters.date_from = urlParams.get("date_from") as string;
      if (urlParams.get("date_to")) filters.date_to = urlParams.get("date_to") as string;
      return filters;
    }
    return {};
  });

  useURLStateSync(setPagination, setSearchValue, setSorting, setClientFilters, (urlParams) => {
    const filters: RoleListFilters = {};

    filters.is_active = parseBooleanParam(urlParams, "is_active");
    filters.is_system_role = parseBooleanParam(urlParams, "is_system_role");

    Object.assign(filters, parseDateRange(urlParams));

    return filters;
  });

  const { handleFilterChange } = useTableFilters<RoleListFilters>(setClientFilters, setSearchValue, setPagination);

  const handlePaginationChange: OnChangeFn<TablePaginationState> = (updaterOrValue) => {
    const newPagination = typeof updaterOrValue === "function" ? updaterOrValue(pagination) : updaterOrValue;

    setPagination(newPagination);

    const url = new URL(window.location.href);
    url.searchParams.set("page", String(newPagination.pageIndex + 1));
    url.searchParams.set("size", String(newPagination.pageSize));
    window.history.replaceState({}, "", url.toString());
  };

  const handleSortingChange: OnChangeFn<SortingState> = (updaterOrValue) => {
    const newSorting = typeof updaterOrValue === "function" ? updaterOrValue(sorting) : updaterOrValue;

    setSorting(newSorting);

    const url = new URL(window.location.href);
    if (newSorting.length > 0) {
      url.searchParams.set("order_by", newSorting[0].id);
      url.searchParams.set("order_desc", String(newSorting[0].desc));
    } else {
      url.searchParams.delete("order_by");
      url.searchParams.delete("order_desc");
    }
    window.history.replaceState({}, "", url.toString());
  };

  return {
    pagination,
    sorting,
    rowSelection,
    setRowSelection,
    searchValue,
    clientFilters,
    handleFilterChange,
    handlePaginationChange,
    handleSortingChange,
  };
}
