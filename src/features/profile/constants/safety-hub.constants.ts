import type { SafetyReportOption } from '../types';
import { TRUSTED_CONTACTS } from './trusted-contacts.constants';

export const SAFETY_HUB_SCREEN = {
  title: 'Safety Hub',
  emergencyHeading: 'Emergency & Safety',
  trustedTitle: 'Trusted Contacts',
  trustedManageLabel: 'ADD/MANAGE',
  trustedBody:
    'Automatically share trip details with your inner circle for peace of mind.',
  sosTitle: 'Emergency Assistance (SOS)',
  sosBody:
    'Immediate connection to local emergency services and our 24/7 security team.',
  reportHeading: 'Report an Issue',
  infoTitle: 'Safety Hub',
  infoMessage:
    'Use trusted contacts, SOS, and reporting tools to stay safe on every BhaiWay trip.',
} as const;

export { TRUSTED_CONTACTS };

export const SAFETY_REPORT_OPTIONS: readonly SafetyReportOption[] = [
  {
    id: 'report-user',
    title: 'Report a Driver or Passenger',
    subtitle: 'Report unprofessional behavior or safety concerns.',
    icon: 'warning-outline',
  },
] as const;
