import type { HomeDashboard } from '../types';
import * as homeMock from './home.mock';

/** Home cards are client-static; deployed backend has no `/home/dashboard` route. */
export const homeService = {
  fetchDashboard: (): Promise<HomeDashboard> => homeMock.fetchDashboard(),
};
