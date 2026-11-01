type Listener = () => void;

/** Bumped after driver POST /rides so My Rides refetches GET /rides/my. */
let generation = 0;
const listeners = new Set<Listener>();

export const driverRidesRefreshStore = {
  getGeneration: (): number => generation,

  bump: (): void => {
    generation += 1;
    listeners.forEach((listener) => {
      try {
        listener();
      } catch {
        // Prevent subscriber errors from bubbling up to publish flows
      }
    });
  },

  subscribe: (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
