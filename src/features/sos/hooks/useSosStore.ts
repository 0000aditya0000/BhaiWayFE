import { useEffect, useState } from 'react';

import { sosStore, type SosUiState } from '../store/sos.store';

export const useSosStore = (): SosUiState => {
  const [state, setState] = useState<SosUiState>(() => sosStore.get());

  useEffect(() => sosStore.subscribe(setState), []);

  return state;
};
