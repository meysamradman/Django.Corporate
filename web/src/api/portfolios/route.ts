import { fetchApi } from "@/core/config/fetch";
import { Portfolio } from "@/types/portfolio/portfolio";
import { PortfolioCategory } from "@/types/portfolio/category/portfolioCategory";
import { PortfolioCategoryListParams } from "@/types/portfolio/category/portfolioCategoryFilter";
import { PortfolioOption } from "@/types/portfolio/options/portfolioOption";
import { PortfolioOptionListParams } from "@/types/portfolio/options/portfolioOptionFilter";
import { PortfolioTag } from "@/types/portfolio/tags/portfolioTag";
import { PortfolioTagListParams } from "@/types/portfolio/tags/portfolioTagFilter";
import { PortfolioListParams } from "@/types/portfolio/portfolioListParams";
import { PaginatedResponse } from "@/types/shared/pagination";
import { toPaginatedResponse, withQuery } from "@/api/shared";

export const portfolioApi = {
  getPortfolioList: async (params?: PortfolioListParams): Promise<PaginatedResponse<Portfolio>> => {
    const response = await fetchApi.get<Portfolio[]>(withQuery("/portfolio/", params as Record<string, unknown>));
    return toPaginatedResponse<Portfolio>(response, params?.size || 10);
  },

  getPortfolioById: async (idOrSlug: string | number): Promise<Portfolio> => {
    const response = await fetchApi.get<Portfolio>(`/portfolio/${idOrSlug}/`);
    return response.data;
  },

  getPortfolioByNumericId: async (id: string | number): Promise<Portfolio> => {
    const response = await fetchApi.get<Portfolio>(`/portfolio/id/${id}/`);
    return response.data;
  },

  getCategories: async (params?: PortfolioCategoryListParams): Promise<PaginatedResponse<PortfolioCategory>> => {
    const response = await fetchApi.get<PortfolioCategory[]>(withQuery("/portfolio-category/", params as Record<string, unknown>));
    return toPaginatedResponse<PortfolioCategory>(response, params?.size || 20);
  },

  getCategoryByNumericId: async (id: string | number): Promise<PortfolioCategory> => {
    const response = await fetchApi.get<PortfolioCategory>(`/portfolio-category/id/${id}/`);
    return response.data;
  },

  getTags: async (params?: PortfolioTagListParams): Promise<PaginatedResponse<PortfolioTag>> => {
    const response = await fetchApi.get<PortfolioTag[]>(withQuery("/portfolio-tag/", params as Record<string, unknown>));
    return toPaginatedResponse<PortfolioTag>(response, params?.size || 20);
  },

  getTagByNumericId: async (id: string | number): Promise<PortfolioTag> => {
    const response = await fetchApi.get<PortfolioTag>(`/portfolio-tag/id/${id}/`);
    return response.data;
  },

  getOptions: async (params?: PortfolioOptionListParams): Promise<PaginatedResponse<PortfolioOption>> => {
    const response = await fetchApi.get<PortfolioOption[]>(withQuery("/portfolio-option/", params as Record<string, unknown>));
    return toPaginatedResponse<PortfolioOption>(response, params?.size || 20);
  },

  getOptionByNumericId: async (id: string | number): Promise<PortfolioOption> => {
    const response = await fetchApi.get<PortfolioOption>(`/portfolio-option/id/${id}/`);
    return response.data;
  },
};
