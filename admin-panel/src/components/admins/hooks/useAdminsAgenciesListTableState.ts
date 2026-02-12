import { useEffect, useState } from "react";
import { useTableFilters } from "@/components/tables/utils/useTableFilters";
import { initSortingFromURL } from "@/components/tables/utils/tableSorting";
import type { SortingState } from "@tanstack/react-table";
import type { TablePaginationState } from "@/types/shared/pagination";

export interface AgencyFilters {
  search?: string;
  is_active?: boolean;
  date_from?: string;
  date_to?: string;
  date_range?: { from?: string; to?: string };
  [key: string]: unknown;
}

export function useAdminsAgenciesListTableState() {
  const [pagination, setPagination] = useState<TablePaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>(() => initSortingFromURL());
  const [searchValue, setSearchValue] = useState("");
  const [clientFilters, setClientFilters] = useState<AgencyFilters>({});

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get("page")) {
      const page = parseInt(urlParams.get("page")!, 10);
      setPagination((prev) => ({ ...prev, pageIndex: page - 1 }));
    }
    if (urlParams.get("size")) {
      const size = parseInt(urlParams.get("size")!, 10);
      setPagination((prev) => ({ ...prev, pageSize: size }));
    }

    if (urlParams.get("order_by") && urlParams.get("order_desc") !== null) {
      const orderBy = urlParams.get("order_by")!;
      const orderDesc = urlParams.get("order_desc") === "true";
      setSorting([{ id: orderBy, desc: orderDesc }]);
    } else {
      setSorting(initSortingFromURL());
    }

    if (urlParams.get("search")) {
      setSearchValue(urlParams.get("search")!);
    }

    const newClientFilters: AgencyFilters = {};
    if (urlParams.get("is_active") !== null) {
      newClientFilters.is_active = urlParams.get("is_active") === "true";
    }
    const dateFrom = urlParams.get("date_from");
    const dateTo = urlParams.get("date_to");
    if (dateFrom || dateTo) {
      newClientFilters.date_from = dateFrom || undefined;
      newClientFilters.date_to = dateTo || undefined;
      newClientFilters.date_range = { from: dateFrom || undefined, to: dateTo || undefined };
    }

    if (Object.keys(newClientFilters).length > 0) {
      setClientFilters(newClientFilters);
    }
  }, []);

  const { handleFilterChange: baseHandleFilterChange } = useTableFilters<AgencyFilters>(
    setClientFilters,
    setSearchValue,
    setPagination
  );

  const handleFilterChange = (filterId: keyof AgencyFilters, value: unknown) => {
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
