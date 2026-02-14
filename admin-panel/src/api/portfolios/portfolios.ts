import { portfolioCoreApi } from './portfolio-api';
import { portfolioTaxonomyApi } from './taxonomy-api';
import { portfolioOptionsApi } from './options-api';

export const portfolioApi = {
  ...portfolioCoreApi,
  ...portfolioTaxonomyApi,
  ...portfolioOptionsApi,
};

export const { getPortfoliosByIds } = portfolioApi;
