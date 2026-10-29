import type { WalletTransaction } from '../types';

const PRIMARY = '#374BB1';
const PRIMARY_SOFT = 'rgba(55, 75, 177, 0.14)';
const CREDIT = '#16A34A';
const CREDIT_SOFT = '#DCFCE7';
const CREDIT_ICON = '#15803D';
const DEBIT = '#BA1A1A';
const DEBIT_SOFT = 'rgba(186, 26, 26, 0.12)';

export type WalletCategoryIonicon =
  | 'car'
  | 'card'
  | 'wallet'
  | 'star'
  | 'cash'
  | 'arrow-down-circle'
  | 'arrow-up-circle'
  | 'alert-circle';

export interface WalletCategoryVisual {
  ionicon: WalletCategoryIonicon;
  accentColor: string;
  iconBackground: string;
  iconColor: string;
}

const normalizeCategory = (value: string | undefined): string =>
  String(value ?? '').trim().toUpperCase();

const iconFromKind = (icon: WalletTransaction['icon']): WalletCategoryIonicon => {
  if (icon === 'car') {
    return 'car';
  }
  if (icon === 'card') {
    return 'card';
  }
  if (icon === 'business') {
    return 'wallet';
  }
  return 'star';
};

const creditVisual = (ionicon: WalletCategoryIonicon): WalletCategoryVisual => ({
  ionicon,
  accentColor: CREDIT,
  iconBackground: CREDIT_SOFT,
  iconColor: CREDIT_ICON,
});

const primaryVisual = (ionicon: WalletCategoryIonicon): WalletCategoryVisual => ({
  ionicon,
  accentColor: PRIMARY,
  iconBackground: PRIMARY_SOFT,
  iconColor: PRIMARY,
});

const debitVisual = (ionicon: WalletCategoryIonicon): WalletCategoryVisual => ({
  ionicon,
  accentColor: DEBIT,
  iconBackground: DEBIT_SOFT,
  iconColor: DEBIT,
});

/** Category-first visuals — accents always use app primary / semantic colors (never gray). */
export const resolveWalletCategoryVisual = (
  transaction: WalletTransaction,
): WalletCategoryVisual => {
  const category = normalizeCategory(transaction.displayCategory);
  const isCredit = transaction.type === 'credit';

  switch (category) {
    case 'BOOKING':
      return primaryVisual('car');
    case 'TOP_UP':
      return primaryVisual('cash');
    case 'BONUS':
      return primaryVisual('star');
    case 'REFUND':
    case 'CANCELLATION':
      return creditVisual('arrow-down-circle');
    case 'EARNING':
    case 'COMPENSATION':
      return creditVisual('star');
    case 'DEPOSIT':
      return primaryVisual('wallet');
    case 'WITHDRAWAL':
      return isCredit
        ? creditVisual('arrow-down-circle')
        : primaryVisual('arrow-up-circle');
    case 'PENALTY':
      return debitVisual('alert-circle');
    case 'ADJUSTMENT':
    case 'OTHER':
      return primaryVisual(iconFromKind(transaction.icon));
    default:
      if (isCredit) {
        return creditVisual(iconFromKind(transaction.icon));
      }
      return primaryVisual(iconFromKind(transaction.icon));
  }
};

/** @deprecated Use resolveWalletCategoryVisual */
export const walletTransactionIonicon = (
  icon: WalletTransaction['icon'],
): WalletCategoryIonicon => iconFromKind(icon);

export type WalletTransactionVisualTokens = {
  creditIcon: string;
  debitIcon: string;
  primary: string;
  neutral: string;
};

/** @deprecated Use resolveWalletCategoryVisual */
export const walletTransactionIconColor = (
  tone: WalletTransaction['iconTone'],
  isCredit: boolean,
  tokens: WalletTransactionVisualTokens,
): string => {
  switch (tone) {
    case 'credit':
      return tokens.creditIcon;
    case 'debit':
      return tokens.debitIcon;
    case 'primary':
      return tokens.primary;
    default:
      return isCredit ? tokens.creditIcon : tokens.primary;
  }
};

/** @deprecated Use resolveWalletCategoryVisual */
export type WalletTransactionIconStyleKey = 'credit' | 'debit' | 'primary' | 'neutral';

/** @deprecated Use resolveWalletCategoryVisual */
export const walletTransactionIconStyleKey = (
  tone: WalletTransaction['iconTone'],
  isCredit: boolean,
): WalletTransactionIconStyleKey => {
  switch (tone) {
    case 'credit':
      return 'credit';
    case 'debit':
      return 'debit';
    case 'primary':
      return 'primary';
    default:
      return isCredit ? 'credit' : 'primary';
  }
};
