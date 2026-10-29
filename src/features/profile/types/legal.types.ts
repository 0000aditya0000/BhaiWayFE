export type LegalPolicyId =
  | 'userAgreement'
  | 'driverAgreement'
  | 'privacy'
  | 'terms';

export interface LegalPolicyItem {
  id: LegalPolicyId;
  title: string;
  subtitle: string;
  url: string;
  icon:
    | 'document-text-outline'
    | 'car-outline'
    | 'shield-checkmark-outline'
    | 'reader-outline';
}
