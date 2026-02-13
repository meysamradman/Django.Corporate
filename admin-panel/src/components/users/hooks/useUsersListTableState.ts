import { useState } from "react";
import { useTableFilters } from "@/components/tables/utils/useTableFilters";
import { useURLStateSync, parseBooleanParam, parseDateRange } from "@/core/hooks/useURLStateSync";
import { initSortingFromURL } from "@/components/tables/utils/tableSorting";
import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import type { TablePaginationState } from "@/types/shared/pagination";
import type { Filter } from "@/types/auth/adminFilter";

interface UseUsersListTableStateParams {
  navigate: (to: string, options?: { replace?: boolean }) => void;
}

export function useUsersListTableState({ navigate }: UseUsersListTableStateParams) {
  const [pagination, setPagination] = useState<TablePaginationState>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const page = parseInt(urlParams.get("page") || "1", 10);
      const size = parseInt(urlParams.get("size") || "10", 10);
      return {
        pageIndex: Math.max(0, page - 1),
        pageSize: size,
      };
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

  const [clientFilters, setClientFilters] = useState<Filter>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const filters: Filter = {};
      const isActive = urlParams.get("is_active");
      if (isActive !== null) filters.is_active = isActive === "true";
      const isVerified = urlParams.get("is_verified");
      if (isVerified !== null) filters.is_verified = isVerified === "true";
      if (urlParams.get("date_from")) filters.date_from = urlParams.get("date_from")!;
      if (urlParams.get("date_to")) filters.date_to = urlParams.get("date_to")!;
      return filters;
    }
    return {};
  });

  useURLStateSync(setPagination, setSearchValue, setSorting, setClientFilters, (urlParams) => {
    const filters: Filter = {};

    filters.is_active = parseBooleanParam(urlParams, "is_active");
    filters.is_verified = parseBooleanParam(urlParams, "is_verified");

    Object.assign(filters, parseDateRange(urlParams));

    return filters;
  });

  const { handleFilterChange } = useTableFilters<Filter>(setClientFilters, setSearchValue, setPagination);

  const handlePaginationChange: OnChangeFn<TablePaginationState> = (updaterOrValue) => {
    const newPagination = typeof updaterOrValue === "function" ? updaterOrValue(pagination) : updaterOrValue;
    setPagination(newPagination);
    const url = new URL(window.location.href);
    url.searchParams.set("page", String(newPagination.pageIndex + 1));
    url.searchParams.set("size", String(newPagination.pageSize));
    navigate(url.search, { replace: true });
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
    navigate(url.search, { replace: true });
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
