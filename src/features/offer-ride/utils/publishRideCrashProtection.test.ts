import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

import { mapRideResponseToPublishedSummary } from './createRide.mapper';
import { driverRidesRefreshStore } from '@/features/my-rides/store/driverRidesRefreshStore';
import type { RideResponseDto } from '../api/rides.types';

// 1. Test mapRideResponseToPublishedSummary resilience against partial/malformed API responses
{
  const minimalResponse = {
    id: 'ride-123',
    driverId: 'drv-456',
    vehicleId: 'veh-789',
    rideType: 'REGULAR',
    status: 'PUBLISHED',
    source: 'Sec 62, Noida',
    destination: 'Cyber City, Gurgaon',
    departureDate: '2026-11-05',
    departureTime: '08:30 AM',
    totalSeats: 3,
    availableSeats: 3,
    pricePerSeat: 250,
    maxTwoInBackSeat: true,
    noSmoking: true,
    noPets: false,
    luggageAllowed: true,
    notes: 'Please be punctual',
  } as unknown as RideResponseDto;

  const summary = mapRideResponseToPublishedSummary(minimalResponse, null);
  assert.strictEqual(summary.rideId, 'ride-123');
  assert.strictEqual(summary.pickupLabel, 'Sec 62, Noida');
  assert.strictEqual(summary.dropoffLabel, 'Cyber City, Gurgaon');
  assert.strictEqual(summary.departureLabel, '05/11/2026 · 8:30 AM');
  assert.strictEqual(summary.seats, 3);
  assert.strictEqual(summary.pricePerSeat, '250');
  assert.strictEqual(summary.rideType, 'regular');
  assert.strictEqual(summary.preferences.noSmoking, true);
  assert.strictEqual(summary.preferences.noPets, false);

  // Missing / undefined fields
  const missingFieldsResponse = {
    id: 'ride-999',
  } as unknown as RideResponseDto;

  const safeSummary = mapRideResponseToPublishedSummary(missingFieldsResponse, null);
  assert.strictEqual(safeSummary.rideId, 'ride-999');
  assert.strictEqual(safeSummary.pickupLabel, 'Starting point');
  assert.strictEqual(safeSummary.dropoffLabel, 'Destination');
  assert.strictEqual(safeSummary.seats, 1);
  assert.strictEqual(safeSummary.pricePerSeat, '0');
  assert.strictEqual(safeSummary.departureLabel, 'Upcoming');
}

// 2. Test driverRidesRefreshStore.bump() isolation against subscriber exceptions
{
  let listenerCalled = false;
  const unsubFaulty = driverRidesRefreshStore.subscribe(() => {
    throw new Error('Faulty subscriber crash');
  });
  const unsubGood = driverRidesRefreshStore.subscribe(() => {
    listenerCalled = true;
  });

  // Should NOT throw even though faulty subscriber throws
  assert.doesNotThrow(() => {
    driverRidesRefreshStore.bump();
  });
  assert.strictEqual(listenerCalled, true, 'Healthy subscriber should execute despite faulty subscriber');

  unsubFaulty();
  unsubGood();
}

// 3. Static check: Verify all Published screens and animations contain NO duration: 0 inside sequences
{
  const offerRidePublishedSrc = fs.readFileSync(
    path.join(__dirname, '../../../screens/offer-ride/OfferRidePublishedScreen/OfferRidePublishedScreen.tsx'),
    'utf8',
  );
  const officeCommutePublishedSrc = fs.readFileSync(
    path.join(__dirname, '../../../screens/office-commute/RidePublishedScreen/RidePublishedScreen.tsx'),
    'utf8',
  );

  assert.ok(!offerRidePublishedSrc.includes('duration: 0'), 'OfferRidePublishedScreen must not have duration: 0');
  assert.ok(!officeCommutePublishedSrc.includes('duration: 0'), 'RidePublishedScreen must not have duration: 0');

  // Verify reversing pulse
  assert.ok(offerRidePublishedSrc.includes('withRepeat'), 'OfferRidePublishedScreen uses withRepeat');
  assert.ok(officeCommutePublishedSrc.includes('withRepeat'), 'RidePublishedScreen uses withRepeat');
}

// 4. Static check: Verify publish handlers have post-create safety & push navigation fallback
{
  const useRidePreferencesSrc = fs.readFileSync(
    path.join(__dirname, '../hooks/useRidePreferences.ts'),
    'utf8',
  );
  const useOfferRidePaymentSrc = fs.readFileSync(
    path.join(__dirname, '../hooks/useOfferRidePayment.ts'),
    'utf8',
  );
  const useReviewDriveSrc = fs.readFileSync(
    path.join(__dirname, '../../office-commute/hooks/useReviewDrive.ts'),
    'utf8',
  );

  // Regular ride
  assert.ok(useRidePreferencesSrc.includes('logger.info(\'[Publish Ride] POST /rides response received\''), 'Regular ride logs response');
  assert.ok(useRidePreferencesSrc.includes('router.replace(ROUTES.offerRidePublished)'), 'Regular ride navigates to published screen');
  assert.ok(useRidePreferencesSrc.includes('router.push(ROUTES.offerRidePublished)'), 'Regular ride has push fallback');

  // Assured ride
  assert.ok(useOfferRidePaymentSrc.includes('logger.info(\'[Assured Publish] POST /rides response received\''), 'Assured ride logs response');
  assert.ok(useOfferRidePaymentSrc.includes('clearPublishIdempotencyKey()'), 'Assured ride clears idempotency key');
  assert.ok(useOfferRidePaymentSrc.includes('router.replace(ROUTES.offerRidePublished)'), 'Assured ride navigates to published screen');
  assert.ok(useOfferRidePaymentSrc.includes('router.push(ROUTES.offerRidePublished)'), 'Assured ride has push fallback');

  // Office commute
  assert.ok(useReviewDriveSrc.includes('publishingRef.current = true'), 'Office commute has synchronous double-tap lock');
  assert.ok(useReviewDriveSrc.includes('logger.info(\'[Commute Publish] POST /rides response received\''), 'Office commute logs response');
  assert.ok(useReviewDriveSrc.includes('router.replace(ROUTES.officeCommutePublished)'), 'Office commute navigates to published screen');
  assert.ok(useReviewDriveSrc.includes('router.push(ROUTES.officeCommutePublished)'), 'Office commute has push fallback');
  assert.ok(!useReviewDriveSrc.includes('showAppAlert(\'Ride published\', occurrenceSummary.message)'), 'Office commute does not show modal alert right before navigation');
}

console.log('publishRideCrashProtection tests passed successfully!');

