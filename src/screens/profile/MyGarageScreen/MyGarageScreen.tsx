import React, { useCallback } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFooter, IconButton, UploadDocumentSheet, AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';
import { triggerLightHaptic } from '@/shared/utils';
import {
  GARAGE_WHY_IMAGE,
  MY_GARAGE_SCREEN,
  VEHICLE_RC_STATUS_LABEL,
} from '@/features/profile/constants';
import { useMyGarage } from '@/features/profile/hooks';
import type { VehicleRcStatus } from '@/features/profile/types';
import { garageTokens, styles } from './MyGarageScreen.styles';

const rcStatusUi = (status: VehicleRcStatus) => {
  if (status === 'approved') {
    return {
      badge: styles.statusApproved,
      label: styles.statusLabelApproved,
      icon: 'checkmark-circle' as const,
      color: garageTokens.APPROVED_TEXT,
    };
  }
  return {
    badge: styles.statusPending,
    label: styles.statusLabelPending,
    icon: 'time' as const,
    color: garageTokens.PENDING_TEXT,
  };
};

export const MyGarageScreen = () => {
  const {
    vehicles,
    loading,
    verifySheetVisible,
    verifyUploading,
    togglingVehicleId,
    goBack,
    deleteVehicle,
    addVehicle,
    editVehicle,
    toggleVehicleActive,
    openVerifyVehicle,
    closeVerifySheet,
    applyVerifyDocument,
  } = useMyGarage();

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-back"
          onPress={handleBack}
          color={garageTokens.PRIMARY}
          accessibilityLabel="Go back"
        />
        <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
          {MY_GARAGE_SCREEN.title}
        </Text>
      </View>

      <View style={styles.body}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.heroText}>
              <Text style={styles.heroEyebrow}>{MY_GARAGE_SCREEN.heroEyebrow}</Text>
              <Text style={styles.heroTitle}>{MY_GARAGE_SCREEN.heroTitle}</Text>
              <Text style={styles.heroSubtitle}>{MY_GARAGE_SCREEN.heroSubtitle}</Text>
            </View>
            <View style={styles.heroIcon} pointerEvents="none">
              <Ionicons name="car" size={120} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.vehicleList}>
            {loading ? (
              <View style={styles.vehicleCard}>
                <ActivityIndicator size="small" color={garageTokens.PRIMARY} />
              </View>
            ) : null}

            {!loading && vehicles.length === 0 ? (
              <View style={styles.vehicleCard}>
                <View style={styles.vehicleMeta}>
                  <Text style={styles.vehicleName}>{MY_GARAGE_SCREEN.emptyTitle}</Text>
                  <Text style={styles.vehiclePlate}>{MY_GARAGE_SCREEN.emptySubtitle}</Text>
                </View>
              </View>
            ) : null}

            {!loading
              ? vehicles.map((vehicle) => {
              const status = rcStatusUi(vehicle.rcStatus);
              const isTogglingActive = togglingVehicleId === vehicle.id;
              return (
                <View key={vehicle.id} style={styles.vehicleCard}>
                  <View style={styles.vehicleMain}>
                    <View style={styles.vehicleLeft}>
                      <View style={styles.vehicleIcon}>
                        <Ionicons name="car" size={28} color={garageTokens.PRIMARY} />
                      </View>
                      <View style={styles.vehicleMeta}>
                        <Text style={styles.vehicleName}>{vehicle.name}</Text>
                        {vehicle.color ? (
                          <Text style={styles.vehicleDetail}>
                            {MY_GARAGE_SCREEN.colorLabel}: {vehicle.color}
                          </Text>
                        ) : null}
                        <Text style={styles.vehiclePlate}>{vehicle.plateNumber}</Text>
                        {vehicle.variant ? (
                          <Text style={styles.vehicleDetail}>{vehicle.variant}</Text>
                        ) : null}
                        <View style={styles.statusRow}>
                          <View style={[styles.statusBadge, status.badge]}>
                            <Ionicons name={status.icon} size={14} color={status.color} />
                            <Text style={[styles.statusLabel, status.label]}>
                              {VEHICLE_RC_STATUS_LABEL[vehicle.rcStatus]}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.activeToggleRow}>
                          <Text style={styles.activeToggleLabel}>
                            {MY_GARAGE_SCREEN.activeVehicleToggleLabel}
                          </Text>
                          {isTogglingActive ? (
                            <ActivityIndicator size="small" color={garageTokens.PRIMARY} />
                          ) : (
                            <Switch
                              value={vehicle.isActive}
                              onValueChange={(nextActive) =>
                                toggleVehicleActive(vehicle, nextActive)
                              }
                              trackColor={{
                                false: garageTokens.SURFACE_CONTAINER,
                                true: garageTokens.PRIMARY_CONTAINER,
                              }}
                              thumbColor={colors.white}
                              ios_backgroundColor={garageTokens.SURFACE_CONTAINER}
                              accessibilityLabel={`${MY_GARAGE_SCREEN.activeVehicleToggleLabel} ${vehicle.name}`}
                            />
                          )}
                        </View>
                      </View>
                    </View>
                    <Pressable
                      style={({ pressed }) => [
                        styles.moreButton,
                        pressed && { backgroundColor: 'rgba(220, 38, 38, 0.08)' },
                      ]}
                      onPress={() => deleteVehicle(vehicle)}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete ${vehicle.name}`}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" size={22} color="#DC2626" />
                    </Pressable>
                  </View>

                  <View style={styles.cardActions}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionButton,
                        styles.actionButtonSecondary,
                        pressed && styles.actionButtonPressed,
                      ]}
                      onPress={() => editVehicle(vehicle)}
                      accessibilityRole="button"
                      accessibilityLabel={`${MY_GARAGE_SCREEN.editVehicleLabel} ${vehicle.name}`}
                    >
                      <Ionicons
                        name="create-outline"
                        size={16}
                        color={garageTokens.PRIMARY}
                      />
                      <Text style={styles.actionButtonSecondaryLabel}>
                        {MY_GARAGE_SCREEN.editVehicleLabel}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.actionButton,
                        styles.actionButtonPrimary,
                        (verifyUploading || vehicle.rcStatus === 'approved') &&
                          styles.actionButtonDisabled,
                        pressed &&
                          !verifyUploading &&
                          vehicle.rcStatus !== 'approved' &&
                          styles.actionButtonPressed,
                      ]}
                      onPress={() => openVerifyVehicle(vehicle)}
                      disabled={verifyUploading || vehicle.rcStatus === 'approved'}
                      accessibilityRole="button"
                      accessibilityLabel={`${MY_GARAGE_SCREEN.verifyVehicleLabel} ${vehicle.name}`}
                    >
                      <Ionicons
                        name="shield-checkmark-outline"
                        size={16}
                        color={garageTokens.ON_PRIMARY_CONTAINER}
                      />
                      <Text style={styles.actionButtonPrimaryLabel}>
                        {verifyUploading
                          ? MY_GARAGE_SCREEN.verifyingVehicleLabel
                          : MY_GARAGE_SCREEN.verifyVehicleLabel}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
              : null}

            <View style={styles.whyCard}>
              <View style={styles.whyContent}>
                <Ionicons name="shield-checkmark-outline" size={36} color={garageTokens.PRIMARY} />
                <Text style={styles.whyTitle}>{MY_GARAGE_SCREEN.whyTitle}</Text>
                <Text style={styles.whyBody}>{MY_GARAGE_SCREEN.whyBody}</Text>
              </View>
              <Image
                source={{ uri: GARAGE_WHY_IMAGE }}
                style={styles.whyImage}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
                accessibilityLabel="Vehicle interior"
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomAction}>
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && { transform: [{ scale: 0.97 }] },
            ]}
            onPress={addVehicle}
            accessibilityRole="button"
            accessibilityLabel={MY_GARAGE_SCREEN.addVehicleLabel}
          >
            <Ionicons name="add-circle" size={22} color={garageTokens.ON_PRIMARY_CONTAINER} />
            <Text style={styles.addLabel}>{MY_GARAGE_SCREEN.addVehicleLabel}</Text>
          </Pressable>
        </View>
      </View>

      <AppFooter activeTab="profile" />

      <UploadDocumentSheet
        visible={verifySheetVisible}
        onClose={closeVerifySheet}
        onPicked={applyVerifyDocument}
        title={MY_GARAGE_SCREEN.verifyUploadTitle}
        subtitle={MY_GARAGE_SCREEN.verifyUploadSubtitle}
      />
    </SafeAreaView>
  );
};
