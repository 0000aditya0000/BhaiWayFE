export type ServiceCardVariant = 'outstation' | 'office' | 'publish';

export type HomeCategoryId = 'outstation' | 'office';

export type HomeActionId =
  | 'outstation-publish'
  | 'outstation-book'
  | 'office-publish'
  | 'office-book';

export interface ServiceCardData {
  id: string;
  variant: ServiceCardVariant;
  badge: string;
  badgeIcon: string;
  title: string;
  subtitle: string;
  compactSubtitle?: string;
  actionLabel: string;
  enabled: boolean;
}

export interface HomeAction {
  id: HomeActionId;
  title: string;
  subtitle: string;
  icon: string;
  cta: string;
}

export interface HomeCategory {
  id: HomeCategoryId;
  title: string;
  subtitle: string;
  badge: string;
  badgeIcon: string;
  enabled: boolean;
  actions: readonly HomeAction[];
}

export interface HomeLocation {
  label: string;
  city: string;
}

export interface HomeDashboard {
  location: HomeLocation;
  cardIds: string[];
}

export interface HomeViewData {
  location: HomeLocation;
  serviceCards: ServiceCardData[];
}
