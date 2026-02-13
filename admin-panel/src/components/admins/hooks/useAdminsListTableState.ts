import { useState } from "react";
import { useTableFilters } from "@/components/tables/utils/useTableFilters";
import { useURLStateSync, parseBooleanParam, parseDateRange } from "@/core/hooks/useURLStateSync";
import { initSortingFromURL } from "@/components/tables/utils/tableSorting";
import type { SortingState } from "@tanstack/react-table";
import type { TablePaginationState } from "@/types/shared/pagination";
import type { AdminFilters } from "@/types/auth/admin";

export function useAdminsListTableState() {
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
  const [searchValue, setSearchValue] = useState(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get("search") || "";
    }
    return "";
  });

  const [clientFilters, setClientFilters] = useState<AdminFilters>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const filters: AdminFilters = { user_role_type: "admin" };
      const isActive = urlParams.get("is_active");
      if (isActive !== null) filters.is_active = isActive === "true";
      const isSuperuser = urlParams.get("is_superuser");
      if (isSuperuser !== null) filters.is_superuser = isSuperuser === "true";
      const dateFrom = urlParams.get("date_from");
      const dateTo = urlParams.get("date_to");
      if (dateFrom) filters.date_from = dateFrom;
      if (dateTo) filters.date_to = dateTo;
      if (dateFrom || dateTo) {
        (filters as any).date_range = { from: dateFrom || undefined, to: dateTo || undefined };
      }
      return filters;
    }
    return { user_role_type: "admin" };
  });

  useURLStateSync(setPagination, setSearchValue, setSorting, setClientFilters, (urlParams) => {
    const filters: AdminFilters = { user_role_type: "admin" };

    filters.is_active = parseBooleanParam(urlParams, "is_active");
    filters.is_superuser = parseBooleanParam(urlParams, "is_superuser");

    Object.assign(filters, parseDateRange(urlParams));

    return filters;
  });

  const { handleFilterChange: baseHandleFilterChange } = useTableFilters<AdminFilters>(
    setClientFilters,
    setSearchValue,
    setPagination
  );

  const handleFilterChange = (filterId: keyof AdminFilters, value: unknown) => {
    if (filterId === "user_role_type") {
      return;
    }
    baseHandleFilterChange(filterId as string, value);
  };

  const handlePaginationChange = (
    updaterOrValue: TablePaginationState | ((prev: TablePaginationState) => TablePaginationState)
  ) => {
    const newPagination = typeof updaterOrValue === "function" ? updaterOrValue(pagination) : updaterOrValue;
    setPagination(newPagination);

    const url = new URL(window.location.href);
    url.searchParams.set("page", String(newPagination.pageIndex + 1));
    url.searchParams.set("size", String(newPagination.pageSize));
    window.history.replaceState({}, "", url.toString());
  };

  return {
    pagination,
    sorting,
    searchValue,
    clientFilters,
    handleFilterChange,
    handlePaginationChange,
  };
}
