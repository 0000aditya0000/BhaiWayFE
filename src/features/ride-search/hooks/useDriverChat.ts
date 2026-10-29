/**
 * Legacy hook — ride chat now uses backend REST + `/chat` Socket.IO.
 * Kept as a thin re-export so older imports keep compiling.
 */
export {
  useConversationChat as useDriverChat,
  type UseConversationChatParams as UseDriverChatParams,
  type UseConversationChatResult as UseDriverChatResult,
} from '@/features/chat';
