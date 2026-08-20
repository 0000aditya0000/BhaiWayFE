import { HOME_SERVICE_CARDS } from '../constants';
import type { HomeDashboard, HomeViewData, ServiceCardData } from '../types';

const CARD_BY_ID = new Map<string, ServiceCardData>(
  HOME_SERVICE_CARDS.map((card) => [card.id, card]),
);

export const mapDashboardToViewData = (dashboard: HomeDashboard): HomeViewData => {
  const serviceCards = dashboard.cardIds
    .map((id) => CARD_BY_ID.get(id))
    .filter((card): card is ServiceCardData => Boolean(card?.enabled));

  return {
    location: dashboard.location,
    serviceCards,
  };
};

export const getFirstName = (fullName: string | undefined | null): string => {
  if (!fullName?.trim()) {
    return 'User';
  }
  const [first] = fullName.trim().split(/\s+/);
  return first || 'User';
};
