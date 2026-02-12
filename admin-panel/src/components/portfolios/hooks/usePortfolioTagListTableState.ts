import { useState } from "react";
import { useTableFilters } from "@/components/tables/utils/useTableFilters";
import { useTagFilterOptions, getTagFilterConfig } from "@/components/portfolios/tags/list/TagTableFilters";
import { initSortingFromURL } from "@/components/tables/utils/tableSorting";
import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import type { TablePaginationState } from "@/types/shared/pagination";

export function usePortfolioTagListTableState() {
  const { booleanFilterOptions } = useTagFilterOptions();
  const tagFilterConfig = getTagFilterConfig(booleanFilterOptions);

  const [pagination, setPagination] = useState<TablePaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>(() => initSortingFromURL());
  const [rowSelection, setRowSelection] = useState({});
  const [searchValue, setSearchValue] = useState("");
  const [clientFilters, setClientFilters] = useState<Record<string, unknown>>({
    is_active: undefined,
    is_public: undefined,
    date_from: undefined,
    date_to: undefined,
  });

  const { handleFilterChange } = useTableFilters(
    setClientFilters,
    setSearchValue,
    setPagination
  );

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
    tagFilterConfig,
    handlePaginationChange,
    handleSortingChange,
  };
}
