import type {
  SupportBookingsSubcategory,
  SupportOthersSubcategory,
  SupportPaymentsSubcategory,
  SupportTicketCategory,
  SupportTicketStatus,
} from '../api/support.types';

export const SUPPORT_DESCRIPTION_MAX = 4000;
export const SUPPORT_COMMENT_MAX = 2000;
export const SUPPORT_ATTACHMENT_MAX = 3;

export const SUPPORT_CATEGORY_SUBCATEGORIES: Record<
  SupportTicketCategory,
  readonly string[]
> = {
  BOOKINGS_AND_RIDES: [
    'VEHICLE_ISSUE',
    'DRIVER_BEHAVIOUR',
    'PAYMENT_FARE',
    'SAFETY_CONCERN',
    'APP_ISSUES',
    'OTHER',
  ] as const satisfies readonly SupportBookingsSubcategory[],
  PAYMENTS_AND_WALLETS: [
    'WALLET_ISSUE',
    'PAYMENT_FAILED',
    'REFUND_ISSUE',
    'FARE_DISPUTE',
    'WITHDRAWAL_ISSUE',
    'OTHER',
  ] as const satisfies readonly SupportPaymentsSubcategory[],
  OTHERS: [
    'ACCOUNT_ISSUE',
    'VERIFICATION_ISSUE',
    'APP_ISSUE',
    'SUGGESTION',
    'OTHER',
  ] as const satisfies readonly SupportOthersSubcategory[],
};

export const SUPPORT_STATUS_LABEL: Record<SupportTicketStatus, string> = {
  CREATED: 'Created',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
};

export const SUPPORT_CATEGORY_LABEL: Record<SupportTicketCategory, string> = {
  BOOKINGS_AND_RIDES: 'Bookings & Rides',
  PAYMENTS_AND_WALLETS: 'Payments & Wallets',
  OTHERS: 'Others',
};

export const SUPPORT_SUBCATEGORY_LABEL: Record<string, string> = {
  VEHICLE_ISSUE: 'Vehicle issue',
  DRIVER_BEHAVIOUR: 'Driver behaviour',
  PAYMENT_FARE: 'Payment / fare',
  SAFETY_CONCERN: 'Safety concern',
  APP_ISSUES: 'App issues',
  WALLET_ISSUE: 'Wallet issue',
  PAYMENT_FAILED: 'Payment failed',
  REFUND_ISSUE: 'Refund issue',
  FARE_DISPUTE: 'Fare dispute',
  WITHDRAWAL_ISSUE: 'Withdrawal issue',
  ACCOUNT_ISSUE: 'Account issue',
  VERIFICATION_ISSUE: 'Verification issue',
  APP_ISSUE: 'App issue',
  SUGGESTION: 'Suggestion',
  OTHER: 'Other',
};

export type SupportHomeCategory = {
  id: SupportTicketCategory;
  title: string;
  subtitle: string;
  icon: 'calendar-outline' | 'wallet-outline' | 'help-buoy-outline';
};

export const SUPPORT_HOME_CATEGORIES: readonly SupportHomeCategory[] = [
  {
    id: 'BOOKINGS_AND_RIDES',
    title: 'Bookings & Rides',
    subtitle: 'Trips, drivers, vehicle, and fare issues',
    icon: 'calendar-outline',
  },
  {
    id: 'PAYMENTS_AND_WALLETS',
    title: 'Payments & Wallets',
    subtitle: 'Wallet, refunds, withdrawals, and payments',
    icon: 'wallet-outline',
  },
  {
    id: 'OTHERS',
    title: 'Others',
    subtitle: 'Account, verification, app, and suggestions',
    icon: 'help-buoy-outline',
  },
] as const;

export const HELP_SUPPORT_SCREEN = {
  title: 'Help & Support',
  searchPlaceholder: 'How can we help you today?',
  categoriesHeading: 'Support Categories',
  recentHeading: 'Recent Tickets',
  viewAllLabel: 'My Tickets',
  raiseTicketLabel: 'Raise a Ticket',
  emailLabel: 'Email Us',
  emailErrorTitle: 'Unable to open email',
  emailErrorMessage: 'Please email us at support@bhaiway.app',
  emptyRecent: 'No tickets yet. Raise one if you need help.',
  loadErrorTitle: 'Couldn’t load tickets',
  unauthenticated: 'Sign in to view your support tickets.',
} as const;

export const SUPPORT_TICKETS_SCREEN = {
  title: 'My Tickets',
  emptyTitle: 'No support tickets',
  emptyMessage: 'When you raise a ticket, it will appear here.',
  retryLabel: 'Retry',
  filterAll: 'All',
  loadMoreError: 'Couldn’t load more tickets.',
} as const;

export const CREATE_SUPPORT_TICKET_SCREEN = {
  title: 'Raise a Ticket',
  categoryHeading: 'Category',
  subcategoryHeading: 'Issue type',
  rideHeading: 'Select a ride',
  activeRides: 'Active',
  pastRides: 'Past',
  descriptionHeading: 'Describe the issue',
  descriptionPlaceholder: 'Tell us what happened…',
  attachmentsHeading: 'Screenshots (optional)',
  attachmentsHint: 'Up to 3 photos from camera or gallery',
  addScreenshot: 'Add screenshot',
  submitLabel: 'Submit ticket',
  submittingLabel: 'Submitting…',
  rideRequired: 'Select an active or past ride to continue.',
  subcategoryRequired: 'Select an issue type.',
  descriptionRequired: 'Please describe the issue.',
  descriptionTooLong: `Description must be ${SUPPORT_DESCRIPTION_MAX} characters or fewer.`,
  emptyActiveRides: 'No active rides available for support.',
  emptyPastRides: 'No past rides available for support.',
  uploadFailed: 'Screenshot upload failed. Remove it or try again.',
  maxAttachments: `You can attach up to ${SUPPORT_ATTACHMENT_MAX} screenshots.`,
  successTitle: 'Ticket created',
  errorTitle: 'Couldn’t create ticket',
} as const;

export const SUPPORT_TICKET_DETAIL_SCREEN = {
  title: 'Ticket details',
  commentsHeading: 'Conversation',
  historyHeading: 'Status history',
  attachmentsHeading: 'Attachments',
  relatedRideHeading: 'Related ride',
  relatedTxnHeading: 'Related transaction',
  commentPlaceholder: 'Add more information…',
  sendComment: 'Send',
  sendingComment: 'Sending…',
  resolvedCommentNotice:
    'This ticket is resolved. New comments can’t be added right now.',
  emptyComments: 'No comments yet.',
  emptyHistory: 'No status changes yet.',
  loadError: 'Couldn’t load this ticket.',
  notFound: 'Ticket not found.',
  commentRequired: 'Enter a comment.',
  commentTooLong: `Comment must be ${SUPPORT_COMMENT_MAX} characters or fewer.`,
  commentErrorTitle: 'Couldn’t send comment',
  commentSuccessTitle: 'Comment added',
} as const;
