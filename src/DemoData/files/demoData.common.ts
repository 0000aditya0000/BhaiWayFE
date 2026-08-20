/**
 * Common DemoData constants — single source of truth for local store tabs,
 * headers, ID ranges, roles, and AsyncStorage keys.
 *
 * Path: src/DemoData/files/
 */

export const DEMO_USER_DETAILS_TAB_NAME = 'UserDetails';
export const DEMO_VEHICLES_TAB_NAME = 'Vehicles';
export const DEMO_NOTIFICATIONS_TAB_NAME = 'Notifications';
export const DEMO_CHAT_THREADS_TAB_NAME = 'ChatThreads';
export const DEMO_CHAT_MESSAGES_TAB_NAME = 'ChatMessages';
export const DEMO_WALLET_TRANSACTIONS_TAB_NAME = 'WalletTransactions';
export const DEMO_PUBLISHED_RIDES_TAB_NAME = 'PublishedRides';
export const DEMO_RIDE_BOOKINGS_TAB_NAME = 'RideBookings';
export const DEMO_BANK_ACCOUNTS_TAB_NAME = 'BankAccounts';

/** First UserID on UserDetails. */
export const USER_DETAILS_USER_ID_START = 1001;

/** First VehicleID on Vehicles. */
export const VEHICLES_SHEET_VEHICLE_ID_START = 2001;

/** First NotificationID on Notifications. */
export const NOTIFICATIONS_SHEET_ID_START = 3001;

/** First ThreadID on ChatThreads. */
export const CHAT_THREADS_SHEET_ID_START = 4001;

/** First MessageID on ChatMessages. */
export const CHAT_MESSAGES_SHEET_ID_START = 5001;

/** First TransactionID on WalletTransactions. */
export const WALLET_TRANSACTIONS_SHEET_ID_START = 6001;

/** First RideID on PublishedRides. */
export const PUBLISHED_RIDES_SHEET_ID_START = 7001;

/** First BookingID on RideBookings. */
export const RIDE_BOOKINGS_SHEET_ID_START = 8001;

/** First BankAccountID on BankAccounts. */
export const BANK_ACCOUNTS_SHEET_ID_START = 9001;

/** AsyncStorage keys for local DemoData mirrors. */
export const DEMO_STORAGE_KEYS = {
  users: '@bhaiway/demo-users',
  vehicles: '@bhaiway/demo-vehicles',
  bookings: '@bhaiway/demo-bookings',
  userDetailsSheet: '@bhaiway/demo-user-details-sheet',
  vehiclesSheet: '@bhaiway/demo-vehicles-sheet',
  /** Soft-deleted vehicle IDs / plates (local tombstones). */
  vehiclesDeleted: '@bhaiway/demo-vehicles-deleted',
  notificationsSheet: '@bhaiway/demo-notifications-sheet',
  chatThreadsSheet: '@bhaiway/demo-chat-threads-sheet',
  chatMessagesSheet: '@bhaiway/demo-chat-messages-sheet',
  walletTransactionsSheet: '@bhaiway/demo-wallet-transactions-sheet',
  publishedRidesSheet: '@bhaiway/demo-published-rides-sheet',
  rideBookingsSheet: '@bhaiway/demo-ride-bookings-sheet',
  bankAccountsSheet: '@bhaiway/demo-bank-accounts-sheet',
} as const;

/** App role — a user may ride, drive, or do both. */
export type UserDetailsSheetRole = 'Rider' | 'Driver' | 'Both';

export const DEMO_USER_ROLES = ['Rider', 'Driver', 'Both'] as const;

export const normalizeSheetRole = (value?: string | null): UserDetailsSheetRole => {
  const key = (value ?? '').trim().toLowerCase();
  if (key === 'driver') {
    return 'Driver';
  }
  if (key === 'rider' || key === 'passenger') {
    return 'Rider';
  }
  return 'Both';
};

/**
 * UserDetails tab headers (exact names).
 * CorporateID appears twice: index 4 = company text, later = Cloudinary Corporate ID URL.
 * Vehicles for a user primarily live on the Vehicles tab (many per user).
 */
export const USER_DETAILS_SHEET_HEADERS = [
  'UserID',
  'UserName',
  'Email',
  'AadharNumber',
  'CorporateID',
  'VehicleModel',
  'VehicleColor',
  'VehicleType',
  'VehicleNumberPlate',
  'BhaiWayWallet',
  'Mobile',
  'ProfilePicture',
  'RC',
  'CorporateID',
  'Role',
] as const;

export type UserDetailsSheetHeader = (typeof USER_DETAILS_SHEET_HEADERS)[number];

export const USER_DETAILS_SHEET_FIELD_KEYS = [
  'userId',
  'userName',
  'email',
  'aadharNumber',
  'corporateId',
  'vehicleModel',
  'vehicleColor',
  'vehicleType',
  'vehicleNumberPlate',
  'bhaiWayWallet',
  'mobile',
  'profilePicture',
  'rc',
  'corporateIdUrl',
  'role',
] as const;

export const userDetailsSheetHeaderCsv = (): string => USER_DETAILS_SHEET_HEADERS.join(',');

/** Vehicles tab headers — one row per vehicle. */
export const VEHICLES_SHEET_HEADERS = [
  'VehicleID',
  'UserID',
  'Mobile',
  'VehicleModel',
  'VehicleColor',
  'VehicleType',
  'VehicleNumberPlate',
  'RC',
] as const;

export type VehiclesSheetHeader = (typeof VEHICLES_SHEET_HEADERS)[number];

export const VEHICLES_SHEET_FIELD_KEYS = [
  'vehicleId',
  'userId',
  'mobile',
  'vehicleModel',
  'vehicleColor',
  'vehicleType',
  'vehicleNumberPlate',
  'rc',
] as const;

export const vehiclesSheetHeaderCsv = (): string => VEHICLES_SHEET_HEADERS.join(',');

/** Notifications tab — one row per alert, scoped by Mobile / UserID. */
export const NOTIFICATIONS_SHEET_HEADERS = [
  'NotificationID',
  'UserID',
  'Mobile',
  'Title',
  'Body',
  'TimeLabel',
  'Category',
  'Section',
  'Unread',
  'CreatedAt',
] as const;

export type NotificationsSheetHeader = (typeof NOTIFICATIONS_SHEET_HEADERS)[number];

export const NOTIFICATIONS_SHEET_FIELD_KEYS = [
  'notificationId',
  'userId',
  'mobile',
  'title',
  'body',
  'timeLabel',
  'category',
  'section',
  'unread',
  'createdAt',
] as const;

export const notificationsSheetHeaderCsv = (): string => NOTIFICATIONS_SHEET_HEADERS.join(',');

/** ChatThreads tab — one inbox conversation per user. */
export const CHAT_THREADS_SHEET_HEADERS = [
  'ThreadID',
  'ThreadKey',
  'UserID',
  'Mobile',
  'Role',
  'RideType',
  'PeerName',
  'PeerSubtitle',
  'RouteLabel',
  'LastMessage',
  'TimeLabel',
  'UnreadCount',
  'IsOnline',
  'AvatarUri',
] as const;

export type ChatThreadsSheetHeader = (typeof CHAT_THREADS_SHEET_HEADERS)[number];

export const CHAT_THREADS_SHEET_FIELD_KEYS = [
  'threadId',
  'threadKey',
  'userId',
  'mobile',
  'role',
  'rideType',
  'peerName',
  'peerSubtitle',
  'routeLabel',
  'lastMessage',
  'timeLabel',
  'unreadCount',
  'isOnline',
  'avatarUri',
] as const;

export const chatThreadsSheetHeaderCsv = (): string => CHAT_THREADS_SHEET_HEADERS.join(',');

/** ChatMessages tab — one row per chat bubble (driver / support / user). */
export const CHAT_MESSAGES_SHEET_HEADERS = [
  'MessageID',
  'ThreadKey',
  'UserID',
  'Mobile',
  'Sender',
  'Text',
  'TimeLabel',
  'Status',
  'CreatedAt',
] as const;

export type ChatMessagesSheetHeader = (typeof CHAT_MESSAGES_SHEET_HEADERS)[number];

export const CHAT_MESSAGES_SHEET_FIELD_KEYS = [
  'messageId',
  'threadKey',
  'userId',
  'mobile',
  'sender',
  'text',
  'timeLabel',
  'status',
  'createdAt',
] as const;

export const chatMessagesSheetHeaderCsv = (): string => CHAT_MESSAGES_SHEET_HEADERS.join(',');

/** WalletTransactions tab — one row per credit/debit for a user. */
export const WALLET_TRANSACTIONS_SHEET_HEADERS = [
  'TransactionID',
  'UserID',
  'Mobile',
  'Title',
  'Amount',
  'Type',
  'Icon',
  'DateLabel',
  'Reference',
  'CreatedAt',
] as const;

export type WalletTransactionsSheetHeader = (typeof WALLET_TRANSACTIONS_SHEET_HEADERS)[number];

export const WALLET_TRANSACTIONS_SHEET_FIELD_KEYS = [
  'transactionId',
  'userId',
  'mobile',
  'title',
  'amount',
  'type',
  'icon',
  'dateLabel',
  'reference',
  'createdAt',
] as const;

export const walletTransactionsSheetHeaderCsv = (): string =>
  WALLET_TRANSACTIONS_SHEET_HEADERS.join(',');

/** PublishedRides — driver-published outstation carpool rides. */
export const PUBLISHED_RIDES_SHEET_HEADERS = [
  'RideID',
  'UserID',
  'Mobile',
  'RideType',
  'Origin',
  'Destination',
  'DepartureDate',
  'DepartureTime',
  'AvailableSeats',
  'PricePerSeat',
  'Preferences',
  'Notes',
  'VehicleName',
  'VehiclePlate',
  'MaxTwoInBack',
  'WomenOnly',
  'OriginLat',
  'OriginLng',
  'DestLat',
  'DestLng',
  'Status',
  'PublishedAt',
] as const;

export type PublishedRidesSheetHeader = (typeof PUBLISHED_RIDES_SHEET_HEADERS)[number];

export const PUBLISHED_RIDES_SHEET_FIELD_KEYS = [
  'rideId',
  'userId',
  'mobile',
  'rideType',
  'origin',
  'destination',
  'departureDate',
  'departureTime',
  'availableSeats',
  'pricePerSeat',
  'preferences',
  'notes',
  'vehicleName',
  'vehiclePlate',
  'maxTwoInBack',
  'womenOnly',
  'originLat',
  'originLng',
  'destLat',
  'destLng',
  'status',
  'publishedAt',
] as const;

export const publishedRidesSheetHeaderCsv = (): string => PUBLISHED_RIDES_SHEET_HEADERS.join(',');

/** RideBookings — rider-confirmed bookings from search. */
export const RIDE_BOOKINGS_SHEET_HEADERS = [
  'BookingID',
  'RideID',
  'UserID',
  'Mobile',
  'Origin',
  'Destination',
  'DepartureLabel',
  'DriverName',
  'VehicleLabel',
  'SeatsBooked',
  'Amount',
  'Status',
  'PaymentStatus',
  'OriginLat',
  'OriginLng',
  'DestLat',
  'DestLng',
  'BookedAt',
] as const;

export type RideBookingsSheetHeader = (typeof RIDE_BOOKINGS_SHEET_HEADERS)[number];

export const RIDE_BOOKINGS_SHEET_FIELD_KEYS = [
  'bookingId',
  'rideId',
  'userId',
  'mobile',
  'origin',
  'destination',
  'departureLabel',
  'driverName',
  'vehicleLabel',
  'seatsBooked',
  'amount',
  'status',
  'paymentStatus',
  'originLat',
  'originLng',
  'destLat',
  'destLng',
  'bookedAt',
] as const;

export const rideBookingsSheetHeaderCsv = (): string => RIDE_BOOKINGS_SHEET_HEADERS.join(',');

/** BankAccounts — linked withdrawal / payout accounts per user. */
export const BANK_ACCOUNTS_SHEET_HEADERS = [
  'BankAccountID',
  'UserID',
  'Mobile',
  'HolderName',
  'BankName',
  'AccountNumber',
  'AccountLast4',
  'IFSC',
  'AccountType',
  'Status',
  'CreatedAt',
] as const;

export type BankAccountsSheetHeader = (typeof BANK_ACCOUNTS_SHEET_HEADERS)[number];

export const BANK_ACCOUNTS_SHEET_FIELD_KEYS = [
  'bankAccountId',
  'userId',
  'mobile',
  'holderName',
  'bankName',
  'accountNumber',
  'accountLast4',
  'ifsc',
  'accountType',
  'status',
  'createdAt',
] as const;

export const bankAccountsSheetHeaderCsv = (): string => BANK_ACCOUNTS_SHEET_HEADERS.join(',');
