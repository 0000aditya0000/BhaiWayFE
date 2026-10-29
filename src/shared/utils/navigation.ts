import type { Href, Router } from 'expo-router';

/**
 * Navigate to a terminal destination without keeping the current flow under Back.
 *
 * IMPORTANT: Do NOT call `router.dismissAll()` here. On the root Expo Router stack
 * that returns to `app/index` (Welcome) and looks like a logout after flows such as
 * driver rating submission. `replace` alone moves to the target route while keeping
 * the authenticated session intact.
 */
export const resetTo = (router: Router, href: Href): void => {
  router.replace(href);
};
