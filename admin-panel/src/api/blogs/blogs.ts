import { blogCoreApi } from './blog-api';
import { blogTaxonomyApi } from './taxonomy-api';

export const blogApi = {
  ...blogCoreApi,
  ...blogTaxonomyApi,
};

export const { getBlogsByIds } = blogApi;
