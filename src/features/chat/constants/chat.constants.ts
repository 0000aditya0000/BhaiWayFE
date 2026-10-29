export const CHAT_SCREEN = {
  title: 'Chat',
  inputPlaceholder: 'Type a message...',
  closedBanner: 'This chat is closed because the trip has ended.',
  closedBannerGeneric: 'This chat is closed.',
  emptyMessages: 'No messages yet. Say hello!',
  loading: 'Loading conversation…',
  loadOlder: 'Load earlier messages',
  loadingOlder: 'Loading…',
  peerTyping: 'typing…',
  sendFailed: 'Message not sent. Tap to retry.',
  validationEmpty: 'Message cannot be empty.',
  validationTooLong: 'Message must be 1000 characters or fewer.',
  unavailableTitle: 'Chat unavailable',
  unavailableMessage: 'A chat for this booking is not available yet.',
  forbiddenMessage: 'You do not have access to this conversation.',
  callTitle: 'Call',
  callUnavailable: 'Phone number is not available for this trip yet.',
  callFailed: 'Unable to start a call right now.',
  maxLength: 1000,
  pageSize: 30,
  typingIdleMs: 2500,
  typingThrottleMs: 1200,
} as const;

export const CHAT_QUICK_REPLIES_RIDER = [
  'On my way',
  'Wait 5 mins',
  'Where are you?',
] as const;

export const CHAT_QUICK_REPLIES_DRIVER = [
  'Sure, waiting.',
  "I'm near the pickup.",
] as const;
