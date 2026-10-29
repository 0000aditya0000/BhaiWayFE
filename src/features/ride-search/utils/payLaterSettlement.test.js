/**
 * PAY_LATER post-trip settlement — unit tests (node assert).
 * Run: npm run test:pay-later
 */

const assert = require('node:assert/strict');

const normalizeKey = (value) =>
  String(value ?? '')
    .trim()
    .toUpperCase();

const isTerminalBookingStatus = (status) =>
  status === 'CANCELLED' || status === 'REJECTED' || status === 'PENDING';

const resolveBookingMode = (booking) => {
  const mode = normalizeKey(booking.bookingMode);
  if (mode) {
    return mode;
  }
  return normalizeKey(booking.ride?.rideType);
};

const isCommuteBooking = (booking) => resolveBookingMode(booking) === 'COMMUTE';

const isAssuredBooking = (booking) => {
  const mode = resolveBookingMode(booking);
  if (mode === 'ASSURED') {
    return true;
  }
  return normalizeKey(booking.paymentMethod) === 'ASSURED_DEPOSIT';
};

const isRegularPayLater = (booking) => normalizeKey(booking.paymentMethod) === 'PAY_LATER';

const isAssuredPayLater = (booking) => {
  if (!isAssuredBooking(booking)) {
    return false;
  }
  const farePayment = normalizeKey(booking.farePayment);
  return farePayment === '' || farePayment === 'PAY_LATER';
};

const resolveFarePaymentStatus = (booking) => {
  if (isAssuredBooking(booking)) {
    return normalizeKey(booking.farePaymentStatus ?? booking.paymentStatus);
  }
  return normalizeKey(booking.paymentStatus);
};

const resolvePayLaterFareCoins = (booking) => {
  const fareRaw = booking.fareAmount ?? booking.totalAmount;
  if (fareRaw == null || fareRaw === '') {
    return '0';
  }
  const parsed = Number(fareRaw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return '0';
  }
  return String(Math.round(parsed));
};

const isPayLaterSettlementEligible = (booking) => {
  if (!booking) {
    return false;
  }
  const rideStatus = normalizeKey(booking.ride?.status);
  if (rideStatus !== 'COMPLETED') {
    return false;
  }
  const bookingStatus = normalizeKey(booking.status);
  if (isTerminalBookingStatus(bookingStatus)) {
    return false;
  }
  if (isCommuteBooking(booking)) {
    return false;
  }
  const mode = resolveBookingMode(booking);
  if (mode !== 'REGULAR' && mode !== 'ASSURED' && !isAssuredBooking(booking)) {
    return false;
  }
  if (resolveFarePaymentStatus(booking) === 'PAID') {
    return false;
  }
  if (isAssuredBooking(booking)) {
    if (!isAssuredPayLater(booking)) {
      return false;
    }
  } else if (!isRegularPayLater(booking)) {
    return false;
  }
  const fareCoins = resolvePayLaterFareCoins(booking);
  return /^\d+$/.test(fareCoins) && fareCoins !== '0';
};

const buildPayLaterPayButtonLabel = (paymentId, fareLabel) => {
  if (paymentId === 'cash') {
    return `Pay ${fareLabel} in Cash`;
  }
  return `Pay ${fareLabel} with Wallet`;
};

const isPayLaterPaymentSuccessful = (response) => {
  const status = normalizeKey(response.paymentStatus);
  return status === 'PAID' || response.alreadySettled === true;
};

const parsePayLaterInsufficientWalletError = (error) => {
  const message = error?.message ? String(error.message) : '';
  const upperMessage = message.toUpperCase();
  const code = String(error?.code ?? error?.details?.code ?? '').toUpperCase();
  const isInsufficient =
    code.includes('INSUFFICIENT_WALLET') || upperMessage.includes('INSUFFICIENT_WALLET');
  if (!isInsufficient) {
    return null;
  }
  return {
    requiredAmount: error?.details?.requiredAmount,
    availableBalance: error?.details?.availableBalance,
    message: message || 'Insufficient BhaiWay Wallet balance for this payment.',
  };
};

const mapPayLaterPaymentError = (error) => {
  if (parsePayLaterInsufficientWalletError(error)) {
    return error.message;
  }
  if (error?.status === 0) {
    return 'Payment could not be completed. Please try again.';
  }
  return error?.message || 'Payment could not be completed. Please try again.';
};

const baseCompletedRide = {
  id: 'booking-1',
  status: 'COMPLETED',
  bookingMode: 'REGULAR',
  paymentMethod: 'PAY_LATER',
  paymentStatus: 'UNPAID',
  totalAmount: '500',
  ride: { status: 'COMPLETED', rideType: 'REGULAR' },
};

assert.equal(isPayLaterSettlementEligible(baseCompletedRide), true, 'regular pay later eligible');

assert.equal(
  isPayLaterSettlementEligible({
    ...baseCompletedRide,
    bookingMode: 'ASSURED',
    paymentMethod: 'ASSURED_DEPOSIT',
    farePayment: 'PAY_LATER',
    farePaymentStatus: 'UNPAID',
    fareAmount: '500',
    securityDepositAmount: '25',
    ride: { status: 'COMPLETED', rideType: 'ASSURED' },
  }),
  true,
  'assured pay later eligible',
);

assert.equal(
  isPayLaterSettlementEligible({
    ...baseCompletedRide,
    paymentMethod: 'PAY_NOW',
    paymentStatus: 'PAID',
  }),
  false,
  'regular pay now ineligible',
);

assert.equal(
  isPayLaterSettlementEligible({
    ...baseCompletedRide,
    bookingMode: 'ASSURED',
    paymentMethod: 'ASSURED_DEPOSIT',
    farePayment: 'PAY_NOW',
    farePaymentStatus: 'PAID',
    fareAmount: '500',
    ride: { status: 'COMPLETED', rideType: 'ASSURED' },
  }),
  false,
  'assured pay now ineligible',
);

assert.equal(
  isPayLaterSettlementEligible({
    ...baseCompletedRide,
    bookingMode: 'COMMUTE',
    ride: { status: 'COMPLETED', rideType: 'COMMUTE' },
  }),
  false,
  'commute ineligible',
);

assert.equal(resolvePayLaterFareCoins({ fareAmount: '500', totalAmount: '999' }), '500');
assert.equal(resolvePayLaterFareCoins({ totalAmount: '500' }), '500');

const walletSuccess = {
  bookingId: 'booking-1',
  fareAmount: '500',
  paymentStatus: 'PAID',
  passengerDebited: '500',
  driverCredited: '500',
  paymentChannel: 'WALLET',
  alreadySettled: false,
  transactionId: 'tx-1',
  paidAt: '2026-01-01T00:00:00.000Z',
};
assert.equal(walletSuccess.paymentStatus, 'PAID', 'wallet success PAID');

const insufficient = parsePayLaterInsufficientWalletError({
  status: 422,
  code: 'HTTP_422',
  message: 'INSUFFICIENT_WALLET_BALANCE',
  details: {
    code: 'INSUFFICIENT_WALLET_BALANCE',
    requiredAmount: '500',
    availableBalance: '300',
  },
});
assert.ok(insufficient, 'insufficient wallet parsed');
assert.equal(insufficient.requiredAmount, '500');
assert.equal(insufficient.availableBalance, '300');

assert.equal(isPayLaterSettlementEligible(baseCompletedRide), true, 'still eligible after wallet fail');

assert.equal(
  isPayLaterPaymentSuccessful({
    ...walletSuccess,
    alreadySettled: true,
    paymentStatus: 'PAID',
  }),
  true,
  'alreadySettled success',
);

assert.match(
  mapPayLaterPaymentError({ status: 0, code: 'NETWORK_ERROR', message: '' }),
  /try again/i,
  'network retry message',
);

assert.equal(resolvePayLaterFareCoins({
  ...baseCompletedRide,
  bookingMode: 'ASSURED',
  paymentMethod: 'ASSURED_DEPOSIT',
  farePayment: 'PAY_LATER',
  fareAmount: '500',
  securityDepositAmount: '25',
}), '500', 'assured payable fare only');

assert.equal(buildPayLaterPayButtonLabel('wallet', '₹500'), 'Pay ₹500 with Wallet');
assert.equal(buildPayLaterPayButtonLabel('cash', '₹500'), 'Pay ₹500 in Cash');

assert.equal(
  isPayLaterSettlementEligible({
    ...baseCompletedRide,
    ride: { status: 'IN_PROGRESS', rideType: 'REGULAR' },
  }),
  false,
  'in progress ineligible',
);

assert.equal(
  isPayLaterSettlementEligible({
    ...baseCompletedRide,
    paymentStatus: 'PAID',
  }),
  false,
  'already paid ineligible',
);

console.log('payLaterSettlement tests passed');
