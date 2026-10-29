/**
 * Legacy help-support UI constants.
 * Production ticket flows live in `@/features/support`.
 * Kept for SupportChatScreen / email copy only — no dummy tickets.
 */
export const HELP_SUPPORT_SCREEN = {
  title: 'Help & Support',
  searchPlaceholder: 'How can we help you today?',
  categoriesHeading: 'Support Categories',
  recentHeading: 'Recent Issues',
  viewAllLabel: 'View All',
  emailLabel: 'Email Us',
  comingSoonTitle: 'Coming Soon',
  comingSoonMessage: 'This support option will be available soon.',
  emailErrorTitle: 'Unable to open email',
  emailErrorMessage: 'Please email us at support@bhaiway.app',
} as const;

/** @deprecated Use SUPPORT_HOME_CATEGORIES from `@/features/support`. */
export const SUPPORT_CATEGORIES = [] as const;

/** @deprecated Production never seeds tickets — use GET /support/tickets. */
export const SUPPORT_TICKETS = [] as const;

export const SUPPORT_TICKET_STATUS_LABEL = {
  resolved: 'Resolved',
  in_progress: 'In Progress',
  created: 'Created',
} as const;
