import { propertyApi } from './property-api';
import { taxonomyApi } from './taxonomy-api';
import { floorPlansApi } from './floor-plans-api';
import { agentsAgenciesApi } from './agents-agencies-api';
import { locationApi } from './location-api';

export type { FinalizeDealPayload } from './property-api';

export const realEstateApi = {
  ...propertyApi,
  ...taxonomyApi,
  ...floorPlansApi,
  ...agentsAgenciesApi,
  ...locationApi,
};
