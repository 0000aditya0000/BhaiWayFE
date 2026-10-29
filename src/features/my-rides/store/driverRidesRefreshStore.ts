type Listener = () => void;

/** Bumped after driver POST /rides so My Rides refetches GET /rides/my. */
let generation = 0;
const listeners = new Set<Listener>();

export const driverRidesRefreshStore = {
  getGeneration: (): number => generation,

  bump: (): void => {
    generation += 1;
    listeners.forEach((listener) => listener());
  },

  subscribe: (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
