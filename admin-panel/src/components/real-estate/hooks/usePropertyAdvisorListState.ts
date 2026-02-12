import { useState } from "react";

export function usePropertyAdvisorListState() {
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const queryParams = {
    page: currentPage,
    size: pageSize,
    ...(searchValue && { search: searchValue }),
    ...(statusFilter !== "all" && { is_active: statusFilter === "active" }),
    ...(verifiedFilter !== "all" && { is_verified: verifiedFilter === "true" }),
    ...(dateFrom && { date_from: dateFrom }),
    ...(dateTo && { date_to: dateTo }),
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleVerifiedChange = (value: string) => {
    setVerifiedFilter(value);
    setCurrentPage(1);
  };

  const handleDateFromChange = (date: string) => {
    setDateFrom(date);
    setCurrentPage(1);
  };

  const handleDateToChange = (date: string) => {
    setDateTo(date);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return {
    searchValue,
    statusFilter,
    verifiedFilter,
    dateFrom,
    dateTo,
    currentPage,
    pageSize,
    queryParams,
    handleSearchChange,
    handleStatusChange,
    handleVerifiedChange,
    handleDateFromChange,
    handleDateToChange,
    handlePageChange,
    handlePageSizeChange,
  };
}
