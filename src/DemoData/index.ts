/**
 * Local DemoData — persists user-entered data on device (AsyncStorage).
 */

export {
  DEMO_USER_DETAILS_TAB_NAME,
  DEMO_VEHICLES_TAB_NAME,
  DEMO_NOTIFICATIONS_TAB_NAME,
  DEMO_CHAT_THREADS_TAB_NAME,
  DEMO_CHAT_MESSAGES_TAB_NAME,
  DEMO_WALLET_TRANSACTIONS_TAB_NAME,
  DEMO_PUBLISHED_RIDES_TAB_NAME,
  DEMO_RIDE_BOOKINGS_TAB_NAME,
  DEMO_BANK_ACCOUNTS_TAB_NAME,
  DEMO_STORAGE_KEYS,
  DEMO_USER_ROLES,
} from './files';

export type {
  DemoUser,
  DemoUserGender,
  DemoUserRole,
  DemoUserInput,
  DemoVehicle,
  DemoVehicleType,
  DemoVehicleInput,
  DemoBooking,
  DemoBookingStatus,
  DemoPaymentStatus,
  DemoBookingInput,
} from './types';

export type {
  UserDetailsSheetRow,
  UserDetailsSheetPatch,
  UserDetailsSheetHeader,
  UserDetailsSheetRole,
} from './userDetailsSheet.types';
export {
  USER_DETAILS_USER_ID_START,
  USER_DETAILS_SHEET_HEADERS,
  userDetailsSheetHeaderCsv,
  normalizeSheetRole,
} from './userDetailsSheet.types';
export type { VehiclesSheetRow, VehiclesSheetPatch, VehiclesSheetHeader } from './vehiclesSheet.types';
export {
  VEHICLES_SHEET_VEHICLE_ID_START,
  VEHICLES_SHEET_HEADERS,
  vehiclesSheetHeaderCsv,
} from './vehiclesSheet.types';
export type {
  NotificationsSheetRow,
  NotificationsSheetPatch,
  NotificationsSheetHeader,
} from './notificationsSheet.types';
export {
  NOTIFICATIONS_SHEET_ID_START,
  NOTIFICATIONS_SHEET_HEADERS,
  notificationsSheetHeaderCsv,
} from './notificationsSheet.types';
export type {
  ChatThreadsSheetRow,
  ChatThreadsSheetPatch,
  ChatMessagesSheetRow,
  ChatMessagesSheetPatch,
  ChatThreadsSheetHeader,
  ChatMessagesSheetHeader,
} from './chatSheet.types';
export {
  CHAT_THREADS_SHEET_ID_START,
  CHAT_MESSAGES_SHEET_ID_START,
  CHAT_THREADS_SHEET_HEADERS,
  CHAT_MESSAGES_SHEET_HEADERS,
  SUPPORT_CHAT_THREAD_KEY,
  chatThreadsSheetHeaderCsv,
  chatMessagesSheetHeaderCsv,
} from './chatSheet.types';
export type {
  WalletTransactionsSheetRow,
  WalletTransactionsSheetPatch,
  WalletTransactionsSheetHeader,
} from './walletTransactionsSheet.types';
export {
  WALLET_TRANSACTIONS_SHEET_ID_START,
  WALLET_TRANSACTIONS_SHEET_HEADERS,
  walletTransactionsSheetHeaderCsv,
} from './walletTransactionsSheet.types';
export type {
  PublishedRidesSheetRow,
  PublishedRidesSheetPatch,
  PublishedRidesSheetHeader,
  PublishedRideSheetStatus,
  PublishedRideSheetType,
} from './publishedRidesSheet.types';
export {
  PUBLISHED_RIDES_SHEET_ID_START,
  PUBLISHED_RIDES_SHEET_HEADERS,
  publishedRidesSheetHeaderCsv,
} from './publishedRidesSheet.types';
export type {
  RideBookingsSheetRow,
  RideBookingsSheetPatch,
  RideBookingsSheetHeader,
  RideBookingSheetStatus,
  RideBookingSheetPaymentStatus,
} from './rideBookingsSheet.types';
export {
  RIDE_BOOKINGS_SHEET_ID_START,
  RIDE_BOOKINGS_SHEET_HEADERS,
  rideBookingsSheetHeaderCsv,
} from './rideBookingsSheet.types';
export type {
  BankAccountsSheetRow,
  BankAccountsSheetPatch,
  BankAccountsSheetHeader,
  BankAccountSheetStatus,
} from './bankAccountsSheet.types';
export {
  BANK_ACCOUNTS_SHEET_ID_START,
  BANK_ACCOUNTS_SHEET_HEADERS,
  bankAccountsSheetHeaderCsv,
} from './bankAccountsSheet.types';
export type {
  RemoteUserDetailsRow,
  SheetValidationInput,
  SheetValidationResult,
  SheetSyncResult,
  RemoteVehicleRow,
  VehicleSyncInput,
  VehicleSyncResult,
  RemoteNotificationRow,
  NotificationSyncResult,
  RemoteChatThreadRow,
  RemoteChatMessageRow,
  ChatSyncResult,
  RemoteWalletTransactionRow,
  WalletTransactionSyncInput,
  WalletTransactionSyncResult,
  RemotePublishedRideRow,
  PublishedRideSyncInput,
  PublishedRideSyncResult,
  RemoteRideBookingRow,
  RideBookingSyncInput,
  RideBookingSyncResult,
  RemoteBankAccountRow,
  BankAccountSyncInput,
  BankAccountSyncResult,
} from './sheet';

export { demoUsersStore } from './usersStore';
export { demoVehiclesStore, formatDemoVehicleLabel, formatDemoVehiclePlate } from './vehiclesStore';
export { demoBookingsStore } from './bookingsStore';
export { userDetailsSheetStore } from './userDetailsSheetStore';
export { vehiclesSheetStore } from './vehiclesSheetStore';
export { notificationsSheetStore } from './notificationsSheetStore';
export { chatThreadsSheetStore } from './chatThreadsSheetStore';
export { chatMessagesSheetStore } from './chatMessagesSheetStore';
export { walletTransactionsSheetStore } from './walletTransactionsSheetStore';
export { publishedRidesSheetStore } from './publishedRidesSheetStore';
export { rideBookingsSheetStore } from './rideBookingsSheetStore';
export { bankAccountsSheetStore } from './bankAccountsSheetStore';
export {
  userDetailsSheetSync,
  vehiclesSheetSync,
  notificationsSheetSync,
  chatSheetSync,
  walletTransactionsSheetSync,
  formatWalletTransactionDateLabel,
  formatWalletTransactionAmountLabel,
  publishedRidesSheetSync,
  rideBookingsSheetSync,
  bankAccountsSheetSync,
} from './sheet';
export {
  findCurrentUserSheetRow,
  findSheetUserByMobile,
  assertSheetUserForLogin,
  getBhaiWayWalletBalance,
  formatBhaiWayWalletLabel,
  subscribeBhaiWayWallet,
  updateBhaiWayWalletBalance,
  recordWalletTransaction,
  applySheetProfileToSession,
  hydrateSessionFromSheet,
} from './walletFromSheet';
export {
  findDemoUserForSession,
  mapGenderToDemo,
  mapVehicleCategoryToDemo,
  parseRideIdToNumber,
  resolveDemoOwnerId,
  splitVehicleModel,
} from './mappers';

import { demoUsersStore } from './usersStore';
import { demoVehiclesStore } from './vehiclesStore';
import { demoBookingsStore } from './bookingsStore';
import { userDetailsSheetStore } from './userDetailsSheetStore';
import { vehiclesSheetStore } from './vehiclesSheetStore';
import { notificationsSheetStore } from './notificationsSheetStore';
import { chatThreadsSheetStore } from './chatThreadsSheetStore';
import { chatMessagesSheetStore } from './chatMessagesSheetStore';
import { walletTransactionsSheetStore } from './walletTransactionsSheetStore';
import { publishedRidesSheetStore } from './publishedRidesSheetStore';
import { rideBookingsSheetStore } from './rideBookingsSheetStore';
import { bankAccountsSheetStore } from './bankAccountsSheetStore';
import { vehiclesSheetSync } from './sheet';
import { applySheetProfileToSession } from './walletFromSheet';

/** Load all DemoData collections from device storage. */
export const hydrateDemoData = async () => {
  await Promise.all([
    demoUsersStore.hydrate(),
    demoVehiclesStore.hydrate(),
    demoBookingsStore.hydrate(),
    userDetailsSheetStore.hydrate(),
    vehiclesSheetStore.hydrate(),
    notificationsSheetStore.hydrate(),
    chatThreadsSheetStore.hydrate(),
    chatMessagesSheetStore.hydrate(),
    walletTransactionsSheetStore.hydrate(),
    publishedRidesSheetStore.hydrate(),
    rideBookingsSheetStore.hydrate(),
    bankAccountsSheetStore.hydrate(),
  ]);

  // Local-only legacy migrate (UserDetails vehicle columns → Vehicles store).
  try {
    await vehiclesSheetSync.pullIntoLocal();
  } catch {
    // ignore
  }

  applySheetProfileToSession();
};

/** Wipe all locally stored DemoData. */
export const clearDemoData = async () => {
  await Promise.all([
    demoUsersStore.clear(),
    demoVehiclesStore.clear(),
    demoBookingsStore.clear(),
    userDetailsSheetStore.clear(),
    vehiclesSheetStore.clear(),
    notificationsSheetStore.clear(),
    chatThreadsSheetStore.clear(),
    chatMessagesSheetStore.clear(),
    walletTransactionsSheetStore.clear(),
    publishedRidesSheetStore.clear(),
    rideBookingsSheetStore.clear(),
    bankAccountsSheetStore.clear(),
  ]);
};
