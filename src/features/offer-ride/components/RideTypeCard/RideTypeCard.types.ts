import type { ButtonVariant } from '@/shared/components/Button/Button.types';

export interface RideTypeCardProps {
  title: string;
  icon: string;
  iconVariant: 'muted' | 'dark';
  description: string;
  buttonLabel: string;
  buttonVariant: ButtonVariant;
  highlighted?: boolean;
  badge?: string;
  note?: string;
  perks?: readonly string[];
  onSelect: () => void;
}
