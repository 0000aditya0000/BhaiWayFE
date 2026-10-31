export const ENDPOINTS = {
  auth: {
    requestOtp: '/auth/otp/request',
    verifyOtp: '/auth/otp/verify',
    /**
     * Acknowledge / send OTP for MSG91 login.
     * Play Store review phone: backend acknowledges without SMS.
     */
    msg91Send: '/auth/msg91/send',
    /**
     * Exchange MSG91 widget access-token (or review phone+otp) for BhaiWay JWT.
     */
    msg91Verify: '/auth/msg91/verify',
  },
  users: {
    /** Authenticated user + profile (Bearer JWT). */
    me: '/users/me',
    /** Create profile after MSG91 → BhaiWay JWT (Bearer JWT). */
    profile: '/users/profile',
    emailVerification: {
      /** Send email verification OTP (Bearer JWT). */
      send: '/users/email-verification/send',
      /** Verify email OTP (Bearer JWT). */
      verify: '/users/email-verification/verify',
      /** Current email verification status (Bearer JWT). */
      status: '/users/email-verification/status',
    },
  },
  corporateIdentity: {
    /** Send corporate identity OTP (Bearer JWT). */
    send: '/corporate-identity/send',
    /** Verify corporate identity OTP (Bearer JWT). */
    verify: '/corporate-identity/verify',
    /** Current corporate identity status (Bearer JWT). */
    status: '/corporate-identity/status',
  },

  home: {
    dashboard: '/home/dashboard',
  },
  media: {
    /** Persist Cloudinary secure_url + public_id after client upload. */
    saveAsset: '/media/assets',
    /** Backend-signed Cloudinary destroy. */
    deleteAsset: '/media/cloudinary/delete',
  },
  vehicles: {
    /** List vehicles for the authenticated user (Bearer JWT). */
    list: '/vehicles',
    /** Create / register a vehicle with RC Cloudinary URL. */
    create: '/vehicles',
    byId: (id: string) => `/vehicles/${id}`,
    activate: (id: string) => `/vehicles/${id}/activate`,
    /** Cashfree RC verification via BhaiWay backend (Bearer JWT). */
    verifyRc: (id: string) => `/vehicles/${id}/verify-rc`,
  },
  verification: {
    /** Current user verification statuses (Bearer JWT). */
    me: '/verification/me',
    /** Submit identity verification metadata (Bearer JWT). */
    identity: '/verification/identity',
    /** Submit driving-license verification metadata (Bearer JWT). */
    drivingLicense: '/verification/driving-license',
    /** Submit vehicle verification metadata (Bearer JWT). */
    vehicle: '/verification/vehicle',
  },
  kyc: {
    /** Create Cashfree DigiLocker verification session (Bearer JWT). */
    aadhaarDigilockerStart: '/kyc/aadhaar/digilocker/start',
    /** Get DigiLocker verification status (Bearer JWT). */
    aadhaarDigilockerStatus: '/kyc/aadhaar/digilocker/status',
    /** Refresh DigiLocker status/sync document after consent (Bearer JWT). */
    aadhaarDigilockerRefresh: '/kyc/aadhaar/digilocker/refresh',
  },
  rides: {
    /** Publish a ride (Bearer JWT). Driver/status/availableSeats are server-controlled. */
    create: '/rides',
    /** List selectable driving routes between two coordinates (Bearer JWT). */
    routeOptions: '/rides/route-options',
    /** Search published rides for passengers (Bearer JWT). */
    search: '/rides/search',
    /** Passenger-safe ride details (Bearer JWT). */
    publicById: (id: string) => `/rides/public/${id}`,
    /** Rides owned by the authenticated driver (Bearer JWT). */
    my: '/rides/my',
    /** In-progress rides the JWT subject drives or is booked on (Bearer JWT). */
    myActive: '/rides/my-active',
    byId: (id: string) => `/rides/${id}`,
    /** Cancel an owned ride before departure (Bearer JWT; owning driver only). */
    cancel: (id: string) => `/rides/${id}/cancel`,
    /** Start an owned Regular ride: PUBLISHED → IN_PROGRESS (Bearer JWT; no body). */
    start: (id: string) => `/rides/${id}/start`,
    /**
     * Complete an owned ride (Bearer JWT; owning driver only).
     * Regular: requires IN_PROGRESS and all active passengers PICKED_UP.
     */
    complete: (id: string) => `/rides/${id}/complete`,
    /** Driver past rides — COMPLETED | CANCELLED only (Bearer JWT). */
    history: '/rides/history',
    historyById: (id: string) => `/rides/history/${id}`,
    /** Passenger reports driver no-show (Bearer JWT; booking owner). */
    driverNoShow: (id: string) => `/rides/${id}/no-show/driver`,
    /** Trigger SOS for an IN_PROGRESS ride (Bearer JWT; ride participant). */
    sos: (id: string) => `/rides/${id}/sos`,
    /** Publish the authenticated participant's location during active SOS. */
    sosLocation: (id: string) => `/rides/${id}/sos/location`,
  },
  ratings: {
    /** Pending rating obligations for the authenticated user (Bearer JWT). */
    pending: '/ratings/pending',
    /** Submit a rating for a pending task (Bearer JWT). */
    submit: '/ratings',
    /** Skip a pending rating task — task stays PENDING on backend (Bearer JWT). */
    skip: (taskId: string) => `/ratings/${taskId}/skip`,
    /** Submitted ratings for a user profile (Bearer JWT). */
    user: (userId: string) => `/ratings/user/${userId}`,
  },
  referrals: {
    /** Authenticated user referral summary (Bearer JWT). */
    summary: '/referrals/summary',
    /** Paginated referrals list for the authenticated referrer (Bearer JWT). */
    list: '/referrals',
  },
  safety: {
    /** Trusted contacts for Safety Hub (Bearer JWT). */
    trustedContacts: '/safety/trusted-contacts',
    trustedContactById: (id: string) => `/safety/trusted-contacts/${id}`,
  },

  wallet: {
    /** Wallet balance snapshot (Bearer JWT). */
    balance: '/wallet',
    /** Paginated wallet ledger (Bearer JWT). */
    transactions: '/wallet/transactions',
    /** Create a top-up payment order (Bearer JWT + Idempotency-Key). */
    topUp: '/wallet/top-up',
    /** Client verification endpoint called after Razorpay checkout completion (Bearer JWT). */
    topUpVerify: '/wallet/top-up/verify',
    /** Mock/dev gateway callback — not for production client use. */
    topUpCallback: '/wallet/top-up/callback',
    topUpById: (orderId: string) => `/wallet/top-up/${orderId}`,
    /** Saved payout methods for withdrawals (Bearer JWT). */
    paymentMethods: '/wallet/payment-methods',
    paymentMethodById: (id: string) => `/wallet/payment-methods/${id}`,
    /** Manual withdrawal (Bearer JWT + Idempotency-Key). */
    withdraw: '/wallet/withdraw',
    withdrawals: '/wallet/withdrawals',
    withdrawalById: (id: string) => `/wallet/withdrawals/${id}`,
  },

  chat: {
    /** List conversations for the authenticated user (Bearer JWT). */
    conversations: '/chat/conversations',
    conversationById: (id: string) => `/chat/conversations/${id}`,
    messages: (id: string) => `/chat/conversations/${id}/messages`,
    read: (id: string) => `/chat/conversations/${id}/read`,
  },
  notifications: {
    /** In-app inbox — paginated list for JWT subject (Bearer JWT). */
    list: '/notifications',
    /** Unread count for JWT subject (Bearer JWT). */
    unreadCount: '/notifications/unread-count',
    /** Mark all unread as read for JWT subject (Bearer JWT). */
    readAll: '/notifications/read-all',
    /** Mark one notification as read (idempotent, Bearer JWT). */
    readOne: (id: string) => `/notifications/${encodeURIComponent(id)}/read`,
    /** Register / refresh FCM device token (Bearer JWT). */
    devices: '/notifications/devices',
    /** Unregister device on logout — token must be URL-encoded. */
    deviceByToken: (token: string) =>
      `/notifications/devices/${encodeURIComponent(token)}`,
  },
  coupons: {
    /** Public coupons available to the current user (Bearer JWT). */
    public: '/coupons/public',
    /** User-specific assigned coupons (Bearer JWT). */
    mine: '/coupons/mine',
    /** Current user redemption history (Bearer JWT). */
    redemptions: '/coupons/redemptions',
    /** Current user issuance history (Bearer JWT). */
    issuances: '/coupons/issuances',
    byId: (id: string) => `/coupons/${id}`,
    /** Validate a coupon for ride type + charge scope (no capacity consumed). */
    validate: '/coupons/validate',
    /** Preview coupon benefit for an amount (no capacity consumed). */
    preview: '/coupons/preview',
  },
  commuteRewards: {
    /** Active Office Commute reward campaigns with own progress (Bearer JWT). */
    campaigns: '/commute-rewards/campaigns',
    campaignById: (id: string) => `/commute-rewards/campaigns/${id}`,
    campaignProgress: (id: string) => `/commute-rewards/campaigns/${id}/progress`,
    /** Submit a reward claim for an eligible milestone (Bearer JWT). */
    claim: (campaignId: string, milestoneId: string) =>
      `/commute-rewards/campaigns/${campaignId}/milestones/${milestoneId}/claims`,
    /** Own claim history (Bearer JWT). */
    claims: '/commute-rewards/claims',
  },
  bookings: {
    /** Create a booking (Bearer JWT). Client must not send passengerId/price/status. */
    create: '/bookings',
    /** Bookings for the authenticated passenger (Bearer JWT). */
    my: '/bookings/my',
    /** Bookings for rides owned by the authenticated driver (Bearer JWT). */
    driverMyRides: '/bookings/driver/my-rides',
    byId: (id: string) => `/bookings/${id}`,
    cancel: (id: string) => `/bookings/${id}/cancel`,
    /**
     * Driver verifies passenger pickup OTP (Bearer JWT).
     * Body: { otp: string }. Never returns pickupOtp to the driver.
     */
    verifyPickup: (id: string) => `/bookings/${id}/verify-pickup`,
    /** Driver accepts a pending Commute booking (Bearer JWT). */
    accept: (id: string) => `/bookings/${id}/accept`,
    /** Driver rejects a pending Commute booking — rider refund (Bearer JWT). */
    reject: (id: string) => `/bookings/${id}/reject`,
    /**
     * Passenger settles outstanding PAY_LATER fare from BhaiWay Wallet (Bearer JWT).
     * No request body — backend determines fare from booking.
     */
    payWallet: (id: string) => `/bookings/${id}/pay-wallet`,
    /**
     * Passenger marks outstanding PAY_LATER fare as paid in cash (Bearer JWT).
     * No request body — backend determines fare from booking.
     */
    payCash: (id: string) => `/bookings/${id}/pay-cash`,
    /** Passenger past bookings — COMPLETED | CANCELLED only (Bearer JWT). */
    history: '/bookings/history',
    historyById: (id: string) => `/bookings/history/${id}`,
    /** Driver reports passenger no-show (Bearer JWT; owning driver). */
    passengerNoShow: (id: string) => `/bookings/${id}/no-show/passenger`,
  },
  tracking: {
    /** Rider GET live driver location (Bearer JWT; authorized trip only). */
    ride: (id: string) => `/tracking/rides/${id}`,
    /** Driver POST current GPS (Bearer JWT; owning IN_PROGRESS ride). */
    location: (id: string) => `/tracking/rides/${id}/location`,
  },
  invoices: {
    /** Tax invoices for the authenticated rider (Bearer JWT). */
    list: '/invoices',
    byId: (id: string) => `/invoices/${encodeURIComponent(id)}`,
    pdf: (id: string) => `/invoices/${encodeURIComponent(id)}/pdf`,
  },
  noShowClaims: {
    byId: (id: string) => `/no-show-claims/${id}`,
    approve: (id: string) => `/no-show-claims/${id}/approve`,
    reject: (id: string) => `/no-show-claims/${id}/reject`,
  },
  support: {
    /** Eligible rides/bookings for Bookings & Rides tickets (Bearer JWT). */
    eligibleRides: '/support/eligible-rides',
    /** Create / list support tickets (Bearer JWT). */
    tickets: '/support/tickets',
    /** Ticket detail for the authenticated owner (Bearer JWT). */
    ticketById: (ticketId: string) => `/support/tickets/${ticketId}`,
    /** Add a user comment on an open ticket (Bearer JWT). */
    ticketComments: (ticketId: string) => `/support/tickets/${ticketId}/comments`,
  },
} as const;
