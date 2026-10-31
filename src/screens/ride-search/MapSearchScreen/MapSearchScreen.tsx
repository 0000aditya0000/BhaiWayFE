import React from 'react';
import { ActivityIndicator, Pressable, SectionList, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFooter, IconButton, AppText as Text, AppTextInput as TextInput } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import {
  DestinationConfirmPanel,
  DestinationMap,
} from '@/features/ride-search/components';
import { useSelectDestination } from '@/features/ride-search/hooks';
import type { PlacesAutocompletePrediction } from '@/features/ride-search/types';
import { getVisibleAddressForZoom } from '@/features/ride-search/utils';
import { styles } from './MapSearchScreen.styles';

export const MapSearchScreen = () => {
  const {
    copy,
    query,
    setQuery,
    searchMode,
    openSearch,
    closeSearch,
    pickCurrentLocation,
    suggestionSections,
    isSearching,
    loading,
    geocoding,
    selecting,
    region,
    selected,
    searchedPlaceName,
    handleRegionChangeComplete,
    markUserMapGesture,
    selectPrediction,
    locateMe,
    confirm,
    goBack,
  } = useSelectDestination();

  const visibleAddress = getVisibleAddressForZoom(selected, region.latitudeDelta);

  const renderSuggestion = ({
    item,
    section,
  }: {
    item: PlacesAutocompletePrediction;
    section: { icon: 'search' | 'time-outline' | 'navigate-outline' };
  }) => (
    <Pressable
      style={styles.row}
      onPress={() => {
        void selectPrediction(item);
      }}
      disabled={selecting}
      accessibilityRole="button"
      accessibilityLabel={item.placeName}
      android_ripple={{ color: 'rgba(29, 78, 216, 0.08)' }}
    >
      <View style={styles.rowIcon}>
        <Ionicons
          name={section.icon === 'search' ? 'location-sharp' : section.icon}
          size={18}
          color={colors.textSecondary}
        />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.placeName} numberOfLines={1}>
          {item.placeName}
        </Text>
        {item.address ? (
          <Text style={styles.address} numberOfLines={1}>
            {item.address}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textPlaceholder} />
    </Pressable>
  );

  if (searchMode) {
    return (
      <SafeAreaView style={styles.searchScreen} edges={['top']}>
        <View style={styles.searchHeader}>
          <IconButton
            icon="arrow-back"
            onPress={closeSearch}
            color={colors.primary}
            accessibilityLabel="Close search"
          />
          <View style={styles.searchField}>
            <Ionicons name="search" size={18} color={colors.primary} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder={copy.searchPlaceholder}
              placeholderTextColor={colors.textPlaceholder}
              returnKeyType="search"
              autoFocus
              accessibilityLabel={copy.searchPlaceholder}
            />
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : query.length > 0 ? (
              <Pressable onPress={() => setQuery('')} accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </Pressable>
            ) : null}
          </View>
        </View>

        <Pressable
          style={styles.currentLocationRow}
          onPress={() => {
            void pickCurrentLocation();
          }}
          disabled={selecting || geocoding}
          accessibilityRole="button"
          accessibilityLabel="Use current location"
          android_ripple={{ color: 'rgba(29, 78, 216, 0.08)' }}
        >
          <View style={[styles.rowIcon, styles.rowIconAccent]}>
            {selecting || geocoding ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="navigate" size={16} color={colors.primary} />
            )}
          </View>
          <Text style={styles.currentLocationText}>Use current location</Text>
        </Pressable>

        {loading && isSearching ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Finding places…</Text>
          </View>
        ) : null}

        <SectionList
          sections={suggestionSections as Array<{
            title: string;
            data: PlacesAutocompletePrediction[];
            icon: 'search' | 'time-outline' | 'navigate-outline';
          }>}
          keyExtractor={(item, index) => `${item.placeId}-${index}`}
          renderItem={renderSuggestion}
          renderSectionHeader={({ section: { title, data } }) =>
            data.length > 0 ? <Text style={styles.sectionLabel}>{title}</Text> : null
          }
          stickySectionHeadersEnabled={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.suggestionsContent}
          ListEmptyComponent={
            loading ? null : (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={32} color={colors.textPlaceholder} />
                <Text style={styles.emptyTitle}>
                  {isSearching ? 'No places found' : 'Search for a place'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {isSearching
                    ? 'Try a different name, area, landmark, airport, or station.'
                    : 'Use current location to set this point, or start typing to search.'}
                </Text>
              </View>
            )
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-back"
          onPress={goBack}
          color={colors.primary}
          accessibilityLabel="Go back"
        />
        <Text style={styles.title}>{copy.title}</Text>
      </View>

      <View style={styles.mapContainer}>
        <DestinationMap
          region={region}
          boundary={selected.boundary}
          onRegionChangeComplete={handleRegionChangeComplete}
          onUserGesture={markUserMapGesture}
          onLocatePress={() => {
            void locateMe({ showInSearchBox: true });
          }}
        />

        <View style={styles.searchOverlay}>
          <Pressable
            style={styles.searchBox}
            onPress={openSearch}
            accessibilityRole="button"
            accessibilityLabel={copy.searchPlaceholder}
          >
            <Ionicons name="search" size={18} color={colors.primary} />
            <Text
              style={[styles.searchValue, !searchedPlaceName && styles.searchPlaceholder]}
              numberOfLines={1}
            >
              {searchedPlaceName || copy.searchPlaceholder}
            </Text>
            <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      <View style={{ paddingBottom: spacing.sm }}>
        <DestinationConfirmPanel
          name={
            visibleAddress.name ||
            (selected.placeName ? selected.placeName : 'Choose a location')
          }
          address={
            visibleAddress.address ||
            selected.address ||
            'Search above or move the map to pick a point'
          }
          hint={copy.hint}
          confirmLabel={copy.confirmLabel}
          loading={geocoding || selecting}
          disabled={geocoding || selecting || !selected.placeName}
          onConfirm={confirm}
        />
      </View>

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};
