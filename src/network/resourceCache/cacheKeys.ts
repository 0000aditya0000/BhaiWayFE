/** Stable resource identities — shared across screens (not per-screen). */
export const cacheKeys = {
  user: {
    me: () => ['users', 'me'] as const,
  },
  wallet: {
    balance: () => ['wallet'] as const,
    transactions: (params?: { page?: number; limit?: number; type?: string }) =>
      ['wallet', 'transactions', params ?? {}] as const,
  },
  vehicles: {
    list: () => ['vehicles'] as const,
    detail: (id: string) => ['vehicles', id] as const,
  },
  verification: {
    me: () => ['verification', 'me'] as const,
  },
  corporateIdentity: {
    status: () => ['corporate-identity', 'status'] as const,
  },
  trustedContacts: {
    list: (params?: { page?: number; limit?: number }) =>
      ['safety', 'trusted-contacts', params ?? {}] as const,
    detail: (id: string) => ['safety', 'trusted-contacts', id] as const,
  },
  referrals: {
    summary: () => ['referrals', 'summary'] as const,
    list: (params?: { page?: number; limit?: number }) =>
      ['referrals', 'list', params ?? {}] as const,
  },
  paymentMethods: {
    list: () => ['wallet', 'payment-methods'] as const,
    detail: (id: string) => ['wallet', 'payment-methods', id] as const,
  },
  withdrawals: {
    list: (params?: { page?: number; limit?: number }) =>
      ['wallet', 'withdrawals', params ?? {}] as const,
    detail: (id: string) => ['wallet', 'withdrawals', id] as const,
  },
  rides: {
    my: () => ['rides', 'my'] as const,
  },
  emailVerification: {
    status: () => ['email-verification', 'status'] as const,
  },
  notifications: {
    unreadCount: () => ['notifications', 'unread-count'] as const,
    list: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
      ['notifications', 'list', params ?? {}] as const,
  },
  support: {
    tickets: (params?: {
      page?: number;
      limit?: number;
      status?: string;
      category?: string;
    }) => ['support', 'tickets', params ?? {}] as const,
    ticketDetail: (ticketId: string) => ['support', 'tickets', ticketId] as const,
    eligibleRides: (params?: { period?: string; page?: number; limit?: number }) =>
      ['support', 'eligible-rides', params ?? {}] as const,
  },
} as const;

export type CacheKey = readonly unknown[];
