import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ROUTES } from '@/config';
import { NoShowClaimPanel, useNoShowClaim } from '@/features/no-show';
import { IconButton, AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';
import { getSearchParam, triggerLightHaptic } from '@/shared/utils';

export const NoShowClaimScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    claimId?: string;
    rideId?: string;
    bookingId?: string;
    kind?: string;
  }>();
  const claimId = getSearchParam(params.claimId);
  const rideId = getSearchParam(params.rideId);
  const bookingId = getSearchParam(params.bookingId);
  const kind = getSearchParam(params.kind).toUpperCase();

  const noShow = useNoShowClaim({
    role: kind === 'PASSENGER_NO_SHOW' ? 'driver' : 'passenger',
    rideId,
    bookingId,
    claimId,
    enabled: Boolean(claimId),
  });

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.myRides);
  }, [router]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top', 'bottom']}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 64,
          paddingHorizontal: 16,
        }}
      >
        <IconButton
          icon="arrow-back"
          onPress={handleBack}
          color={colors.textPrimary}
          accessibilityLabel="Go back"
        />
        <Text
          style={{ flex: 1, marginLeft: 8, fontSize: 20, fontWeight: '700', color: colors.textPrimary }}
          accessibilityRole="header"
        >
          No-Show claim
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        {noShow.loading && !noShow.claim ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <NoShowClaimPanel
            reportLabel={noShow.reportLabel}
            pendingBody={noShow.pendingBody}
            canReport={false}
            canRespond={noShow.canRespond}
            isClaimant={noShow.isClaimant}
            submitting={noShow.submitting}
            responding={noShow.responding}
            claim={noShow.claim}
            remainingMs={noShow.remainingMs}
            onReport={noShow.report}
            onApprove={noShow.approve}
            onReject={noShow.reject}
            onOpenSupport={noShow.openSupport}
          />
        )}
        {noShow.claim?.rideId ? (
          <Pressable
            onPress={() => {
              const related = noShow.claim;
              if (!related) {
                return;
              }
              triggerLightHaptic();
              if (related.bookingId) {
                router.push({
                  pathname: ROUTES.myRidesRiderBooking,
                  params: {
                    bookingId: related.bookingId,
                    rideId: related.rideId,
                    claimId: related.id,
                  },
                });
                return;
              }
              router.push({
                pathname: ROUTES.myRidesTrack,
                params: { rideId: related.rideId, claimId: related.id },
              });
            }}
            accessibilityRole="button"
            accessibilityLabel="View related ride"
          >
            <Text style={{ color: colors.primary, fontWeight: '700' }}>View related ride</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};
