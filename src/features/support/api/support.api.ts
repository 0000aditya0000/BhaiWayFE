import { ENDPOINTS, httpClient } from '@/network';

import type {
  AddSupportCommentBody,
  CreateSupportTicketBody,
  EligibleSupportRidePageDto,
  ListEligibleSupportRidesQuery,
  ListSupportTicketsQuery,
  SupportCommentDto,
  SupportTicketDetailDto,
  SupportTicketPageDto,
} from './support.types';
import {
  normalizeEligibleSupportRidePage,
  normalizeSupportComment,
  normalizeSupportTicketDetail,
  normalizeSupportTicketPage,
} from '../utils/support.mapper';

/** GET /support/eligible-rides?period=&page=&limit= */
export const listEligibleSupportRides = async (
  query: ListEligibleSupportRidesQuery,
): Promise<EligibleSupportRidePageDto> => {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? Math.min(100, query.limit) : 20;
  const params = new URLSearchParams();
  params.set('period', query.period);
  params.set('page', String(page));
  params.set('limit', String(limit));
  const payload = await httpClient.get<unknown>(
    `${ENDPOINTS.support.eligibleRides}?${params.toString()}`,
  );
  return normalizeEligibleSupportRidePage(payload, { page, limit });
};

/** POST /support/tickets */
export const createSupportTicket = async (
  body: CreateSupportTicketBody,
): Promise<SupportTicketDetailDto> => {
  const payload = await httpClient.post<unknown>(ENDPOINTS.support.tickets, body);
  const detail = normalizeSupportTicketDetail(payload);
  if (!detail) {
    throw new Error('Invalid create-ticket response');
  }
  return detail;
};

/** GET /support/tickets?page=&limit=&status=&category= */
export const listSupportTickets = async (
  query: ListSupportTicketsQuery = {},
): Promise<SupportTicketPageDto> => {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? Math.min(100, query.limit) : 20;
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (query.status) {
    params.set('status', query.status);
  }
  if (query.category) {
    params.set('category', query.category);
  }
  const payload = await httpClient.get<unknown>(
    `${ENDPOINTS.support.tickets}?${params.toString()}`,
  );
  return normalizeSupportTicketPage(payload, { page, limit });
};

/** GET /support/tickets/:ticketId */
export const getSupportTicket = async (
  ticketId: string,
): Promise<SupportTicketDetailDto> => {
  const trimmed = ticketId.trim();
  if (!trimmed) {
    throw new Error('Missing ticket id');
  }
  const payload = await httpClient.get<unknown>(ENDPOINTS.support.ticketById(trimmed));
  const detail = normalizeSupportTicketDetail(payload);
  if (!detail) {
    throw new Error('Invalid ticket detail response');
  }
  return detail;
};

/** POST /support/tickets/:ticketId/comments */
export const addSupportTicketComment = async (
  ticketId: string,
  body: AddSupportCommentBody,
): Promise<SupportCommentDto> => {
  const trimmed = ticketId.trim();
  if (!trimmed) {
    throw new Error('Missing ticket id');
  }
  const payload = await httpClient.post<unknown>(
    ENDPOINTS.support.ticketComments(trimmed),
    body,
  );
  const root =
    payload && typeof payload === 'object' && !Array.isArray(payload) && 'data' in payload
      ? (payload as { data: unknown }).data
      : payload;
  const comment = normalizeSupportComment(root) ?? normalizeSupportComment(payload);
  if (!comment) {
    throw new Error('Invalid comment response');
  }
  return comment;
};
