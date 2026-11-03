import { DeletionReason } from '../api/accountDeletion.types';

export interface DeletionReasonItem {
  id: string;
  reason: DeletionReason;
  label: string;
}

export const DELETION_REASONS: readonly DeletionReasonItem[] = [
  {
    id: 'no_longer_need',
    reason: DeletionReason.NO_LONGER_USING,
    label: 'I no longer need BhaiWay.',
  },
  {
    id: 'not_enough_rides',
    reason: DeletionReason.POOR_USER_EXPERIENCE,
    label: 'I am not getting enough rides.',
  },
  {
    id: 'technical_issues',
    reason: DeletionReason.ACCOUNT_OR_TECHNICAL_ISSUES,
    label: 'I am facing technical issues.',
  },
  {
    id: 'privacy_security',
    reason: DeletionReason.PRIVACY_CONCERNS,
    label: 'I have privacy or security concerns.',
  },
  {
    id: 'unhappy_service',
    reason: DeletionReason.POOR_USER_EXPERIENCE,
    label: 'I am unhappy with the service.',
  },
  {
    id: 'switching_platform',
    reason: DeletionReason.SWITCHED_TO_ANOTHER_SERVICE,
    label: 'I am switching to another platform.',
  },
  {
    id: 'other',
    reason: DeletionReason.OTHER,
    label: 'Other.',
  },
] as const;

export const DELETE_ACCOUNT_SCREEN = {
  title: 'Why are you leaving BhaiWay?',
  subtitle: 'Please select a reason to help us improve.',
  warningTitle: 'Account Deletion',
  warningBody: 'Deleting your account is permanent. Select a reason below to proceed.',
  reasonsHeading: 'Select a reason',
  feedbackLabel: 'Additional comments (optional)',
  feedbackPlaceholder: 'Tell us more about your experience (max 1000 characters)...',
  continueLabel: 'Continue',
  keepAccountLabel: 'Keep My Account',
  deleteAccountLabel: 'Delete Account',
  confirmTitle: 'Delete Account?',
  confirmMessage: 'Are you absolutely sure? This action cannot be undone.',
  confirmAction: 'Delete Account',
  confirmCancel: 'Cancel',
} as const;

export const DELETE_ACCOUNT_CONFIRM_SCREEN = {
  title: 'Delete Your BhaiWay Account?',
  warningTitle: 'Important Warning',
  warningParagraphs: [
    'You will lose access to all BhaiWay services.',
    'Upon receipt of your account deletion request, your account with BhaiWay will be scheduled for permanent deletion, including your profile and associated personal information.',
    'However, certain information that we are legally or regulatorily required to retain may be stored for the applicable retention period, which may be up to 5 years where applicable.',
    'Our team will review your request and contact you if any further action is required from your end.',
  ],
  timelineNotice: 'Processing timeline: Up to 7 Indian business days.',
  acknowledgementLabel: 'I understand and accept the account deletion terms and data retention policies.',
  goBackLabel: 'Go Back',
  submitLabel: 'Accept & Raise Deletion Request',
} as const;

export const ACCOUNT_DELETION_RECEIVED_SCREEN = {
  title: 'Account Deletion Request Received',
  paragraphs: [
    'We have received your request to delete your BhaiWay account.',
    'We are processing your request. Our team will get back to you within 7 business days.',
    'If there are no pending actions from your end, we will proceed with your account deletion.',
    'If any action or clarification is required, our team will contact you to help complete the process.',
  ],
  statusLabel: 'Status',
  statusValue: 'Pending Review',
  referenceIdLabel: 'Request Reference ID',
  timelineLabel: 'Expected Processing Time',
  timelineValue: '7 Business Days',
  consequenceNotice: 'Your account is now restricted and you will lose access to BhaiWay services.',
  supportNotice: 'Need assistance or have questions?',
  supportLink: 'Contact Support',
  closeLabel: 'Close',
} as const;

export const ACCOUNT_DELETION_PENDING_SCREEN = {
  title: 'Your Account Deletion Request Is In Progress',
  paragraphs: [
    'You have already submitted a request to delete your BhaiWay account.',
    'You will lose access to BhaiWay services while your request is being processed.',
    'Our team will get back to you within 7 business days.',
    'If there are no pending actions from your end, we will proceed with the deletion of your account. If further action is required, we will contact you.',
    'Certain information may be retained where required to meet legal and regulatory obligations.',
  ],
  referenceIdLabel: 'Request Reference ID',
  statusLabel: 'Current Status',
  timelineLabel: 'Processing Timeline',
  timelineValue: '7 Business Days',
  actionRequiredNotice: 'Action required from your end:',
  cancelButtonLabel: 'Cancel Deletion Request',
  signOutButtonLabel: 'Sign Out',
  cancelConfirmTitle: 'Cancel Account Deletion?',
  cancelConfirmMessage:
    'Are you sure you want to cancel your account deletion request? Your BhaiWay account and services will be restored if cancellation is successful.',
  keepAccountAction: 'Keep My Account',
  cancelConfirmAction: 'Yes, Cancel Request',
} as const;
