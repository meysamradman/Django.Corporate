import { useEffect, useState } from "react";
import { useTableFilters } from "@/components/tables/utils/useTableFilters";
import { useOptionFilterOptions, getOptionFilterConfig } from "@/components/portfolios/options/list/OptionTableFilters";
import { initSortingFromURL } from "@/components/tables/utils/tableSorting";
import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import type { TablePaginationState } from "@/types/shared/pagination";

export function usePortfolioOptionListTableState() {
  const { booleanFilterOptions } = useOptionFilterOptions();
  const optionFilterConfig = getOptionFilterConfig(booleanFilterOptions);

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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get("page")) {
      const page = parseInt(urlParams.get("page")!, 10);
      if (!isNaN(page) && page > 0) {
        setPagination((prev) => ({ ...prev, pageIndex: page - 1 }));
      }
    }
    if (urlParams.get("size")) {
      const size = parseInt(urlParams.get("size")!, 10);
      if (!isNaN(size) && size > 0) {
        setPagination((prev) => ({ ...prev, pageSize: size }));
      }
    }

    if (urlParams.get("order_by") && urlParams.get("order_desc") !== null) {
      const orderBy = urlParams.get("order_by")!;
      const orderDesc = urlParams.get("order_desc") === "true";
      setSorting([{ id: orderBy, desc: orderDesc }]);
    }

    if (urlParams.get("search")) {
      setSearchValue(urlParams.get("search")!);
    }

    const newClientFilters: Record<string, unknown> = {};
    if (urlParams.get("is_active") !== null) {
      newClientFilters.is_active = urlParams.get("is_active");
    }
    if (urlParams.get("is_public") !== null) {
      newClientFilters.is_public = urlParams.get("is_public");
    }

    if (Object.keys(newClientFilters).length > 0) {
      setClientFilters(newClientFilters);
    }
  }, []);

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
    optionFilterConfig,
    handlePaginationChange,
    handleSortingChange,
  };
}
