import type { CommuteMatchFilterId, CommuteResultSortId } from '../../types/commute-ride-result.types';

export interface CommuteRideResultFiltersProps {
  matchFilterId: CommuteMatchFilterId;
  sortId: CommuteResultSortId;
  onMatchFilterChange: (id: CommuteMatchFilterId) => void;
  onSortChange: (id: CommuteResultSortId) => void;
}
