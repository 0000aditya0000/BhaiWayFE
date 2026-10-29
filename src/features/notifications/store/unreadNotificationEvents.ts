type Listener = () => void;

const listeners = new Set<Listener>();

/**
 * Lightweight bus so push listeners / mark-read flows can ask badge + list
 * hooks to refresh without importing React or screens.
 */
export const unreadNotificationEvents = {
  subscribe: (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  emitRefresh: (): void => {
    listeners.forEach((listener) => {
      try {
        listener();
      } catch {
        // ignore listener errors
      }
    });
  },
};
