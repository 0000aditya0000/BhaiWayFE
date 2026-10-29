import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/config';
import type { ApiError } from '@/network';
import { CACHE_STALE_TIMES, cacheKeys, resourceCache } from '@/network/resourceCache';
import { getErrorMessage, showAppAlert, triggerLightHaptic } from '@/shared/utils';
import { authSession } from '@/store';

import { addSupportTicketComment, getSupportTicket } from '../api/support.api';
import type { SupportTicketDetailDto } from '../api/support.types';
import {
  SUPPORT_COMMENT_MAX,
  SUPPORT_TICKET_DETAIL_SCREEN,
} from '../constants/support.constants';
import { isSupportUuid } from '../utils/support.mapper';
import { generateSupportCommentIdempotencyKey } from '../utils/support.payload';

export interface UseSupportTicketDetailResult {
  ticket: SupportTicketDetailDto | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  draft: string;
  setDraft: (value: string) => void;
  canComment: boolean;
  submittingComment: boolean;
  commentError: string | null;
  refresh: () => Promise<void>;
  retry: () => void;
  submitComment: () => Promise<void>;
  goBack: () => void;
}

export const useSupportTicketDetail = (
  ticketId: string,
): UseSupportTicketDetailResult => {
  const router = useRouter();
  const [ticket, setTicket] = useState<SupportTicketDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const inflightRef = useRef(false);
  const commentInflightRef = useRef(false);
  const commentKeyRef = useRef(generateSupportCommentIdempotencyKey());

  const fetchDetail = useCallback(
    async (mode: 'initial' | 'refresh') => {
      const id = ticketId.trim();
      if (!isSupportUuid(id)) {
        setTicket(null);
        setLoading(false);
        setRefreshing(false);
        setError(SUPPORT_TICKET_DETAIL_SCREEN.notFound);
        return;
      }
      if (!authSession.isAuthenticated()) {
        setTicket(null);
        setLoading(false);
        setRefreshing(false);
        setError('Sign in to view this ticket.');
        return;
      }
      if (inflightRef.current) {
        return;
      }
      inflightRef.current = true;
      if (mode === 'refresh') {
        setRefreshing(true);
      } else {
        setLoading(true);
        setError(null);
      }

      try {
        const result = await resourceCache.query<SupportTicketDetailDto>({
          key: cacheKeys.support.ticketDetail(id),
          staleTime: CACHE_STALE_TIMES.SUPPORT_TICKETS,
          force: mode === 'refresh',
          fetcher: () => getSupportTicket(id),
        });
        setTicket(result.data);
        setError(null);
      } catch (err) {
        const apiErr = err as ApiError | undefined;
        if (apiErr?.status === 404 || apiErr?.code === 'SUPPORT_TICKET_NOT_FOUND') {
          setError(SUPPORT_TICKET_DETAIL_SCREEN.notFound);
          setTicket(null);
        } else if (apiErr?.status === 401) {
          setError('Your session expired. Please sign in again.');
          setTicket(null);
        } else {
          setError(getErrorMessage(err) || SUPPORT_TICKET_DETAIL_SCREEN.loadError);
        }
      } finally {
        inflightRef.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [ticketId],
  );

  useFocusEffect(
    useCallback(() => {
      void fetchDetail('initial');
    }, [fetchDetail]),
  );

  const refresh = useCallback(async () => {
    const id = ticketId.trim();
    if (isSupportUuid(id)) {
      resourceCache.invalidate(cacheKeys.support.ticketDetail(id));
    }
    await fetchDetail('refresh');
  }, [fetchDetail, ticketId]);

  const retry = useCallback(() => {
    void fetchDetail('initial');
  }, [fetchDetail]);

  const canComment = ticket != null && String(ticket.status).toUpperCase() !== 'RESOLVED';

  const submitComment = useCallback(async () => {
    if (!ticket || !canComment || commentInflightRef.current) {
      return;
    }
    const message = draft.trim();
    if (!message) {
      setCommentError(SUPPORT_TICKET_DETAIL_SCREEN.commentRequired);
      return;
    }
    if (message.length > SUPPORT_COMMENT_MAX) {
      setCommentError(SUPPORT_TICKET_DETAIL_SCREEN.commentTooLong);
      return;
    }

    commentInflightRef.current = true;
    setSubmittingComment(true);
    setCommentError(null);
    triggerLightHaptic();

    try {
      await addSupportTicketComment(ticket.id, {
        message,
        idempotencyKey: commentKeyRef.current,
      });
      commentKeyRef.current = generateSupportCommentIdempotencyKey();
      setDraft('');
      resourceCache.invalidate(cacheKeys.support.ticketDetail(ticket.id));
      resourceCache.invalidate(['support', 'tickets']);
      await fetchDetail('refresh');
      showAppAlert(
        SUPPORT_TICKET_DETAIL_SCREEN.commentSuccessTitle,
        'Your message was added to the ticket.',
      );
    } catch (err) {
      const apiErr = err as ApiError | undefined;
      if (apiErr?.code === 'SUPPORT_TICKET_RESOLVED' || apiErr?.status === 409) {
        setCommentError(SUPPORT_TICKET_DETAIL_SCREEN.resolvedCommentNotice);
        await fetchDetail('refresh');
      } else {
        const messageText = getErrorMessage(err);
        setCommentError(messageText);
        showAppAlert(SUPPORT_TICKET_DETAIL_SCREEN.commentErrorTitle, messageText);
      }
    } finally {
      commentInflightRef.current = false;
      setSubmittingComment(false);
    }
  }, [canComment, draft, fetchDetail, ticket]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.supportTickets);
  }, [router]);

  return {
    ticket,
    loading,
    refreshing,
    error,
    draft,
    setDraft,
    canComment,
    submittingComment,
    commentError,
    refresh,
    retry,
    submitComment,
    goBack,
  };
};
