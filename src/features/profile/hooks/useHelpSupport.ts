/**
 * @deprecated Prefer `useHelpSupportHome` from `@/features/support`.
 * Thin shim so older imports keep compiling without dummy ticket data.
 */
export {
  useHelpSupportHome as useHelpSupport,
  type UseHelpSupportHomeResult as UseHelpSupportResult,
} from '@/features/support/hooks/useHelpSupportHome';
