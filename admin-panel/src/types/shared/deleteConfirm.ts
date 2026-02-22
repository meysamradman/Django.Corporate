export type DeleteConfirmState<
  TSingleKey extends string,
  TBulkKey extends string
> = {
  open: boolean;
  isBulk: boolean;
} & Partial<Record<TSingleKey, number>> &
  Partial<Record<TBulkKey, number[]>>;

export type UserDeleteConfirmState = DeleteConfirmState<'userId', 'userIds'>;
export type RoleDeleteConfirmState = DeleteConfirmState<'roleId', 'roleIds'>;

export type PropertyDeleteConfirmState = DeleteConfirmState<'propertyId', 'propertyIds'>;
export type PropertyFeatureDeleteConfirmState = DeleteConfirmState<'featureId', 'featureIds'>;
export type PropertyLabelDeleteConfirmState = DeleteConfirmState<'labelId', 'labelIds'>;
export type PropertyListingTypeDeleteConfirmState = DeleteConfirmState<'listingTypeId', 'listingTypeIds'>;
export type PropertyTagDeleteConfirmState = DeleteConfirmState<'tagId', 'tagIds'>;
export type PropertyTypeDeleteConfirmState = DeleteConfirmState<'typeId', 'typeIds'>;

export type PortfolioDeleteConfirmState = DeleteConfirmState<'portfolioId', 'portfolioIds'>;
export type PortfolioCategoryDeleteConfirmState = DeleteConfirmState<'categoryId', 'categoryIds'>;
export type PortfolioOptionDeleteConfirmState = DeleteConfirmState<'optionId', 'optionIds'>;
export type PortfolioTagDeleteConfirmState = DeleteConfirmState<'tagId', 'tagIds'>;

export type BlogDeleteConfirmState = DeleteConfirmState<'blogId', 'blogIds'>;
export type BlogCategoryDeleteConfirmState = DeleteConfirmState<'categoryId', 'categoryIds'>;
export type BlogTagDeleteConfirmState = DeleteConfirmState<'tagId', 'tagIds'>;

export type AdminDeleteConfirmState = DeleteConfirmState<'adminId', 'adminIds'>;
export type AgencyDeleteConfirmState = DeleteConfirmState<'agencyId', 'agencyIds'>;
