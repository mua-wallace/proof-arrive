/**
 * Select Geozone Step Component
 * Allows users to select a geozone or enter a custom center
 */

import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor, useThemeColors } from '@/hooks/use-theme-color';
import type { ParsedZone } from '@/types/geozone';

import { CustomCenterForm } from './CustomCenterForm';
import { GeozoneModal } from './GeozoneModal';
import { LoadingOverlay } from './LoadingOverlay';

interface SelectGeozoneStepProps {
  isChangingCenter: boolean;
  locationCheckFailed: boolean;
  showCustomCenter: boolean;
  selectedGeozone: ParsedZone | null;
  showGeozoneModal: boolean;
  isLoading: boolean;
  customCenterName: string;
  customCenterId: string;
  geozones: ParsedZone[];
  onGoBack?: () => void;
  onSelectGeozone: () => void;
  onConfirmGeozone: () => void;
  onShowCustomCenter: () => void;
  onHideCustomCenter: () => void;
  onCustomCenterNameChange: (name: string) => void;
  onCustomCenterIdChange: (id: string) => void;
  onSaveCustomCenter: () => void;
  onGeozoneSelect: (geozone: ParsedZone) => void;
  onGeozoneModalClose: () => void;
}

export function SelectGeozoneStep({
  isChangingCenter,
  locationCheckFailed,
  showCustomCenter,
  selectedGeozone,
  showGeozoneModal,
  isLoading,
  customCenterName,
  customCenterId,
  onGoBack,
  onSelectGeozone,
  onConfirmGeozone,
  onShowCustomCenter,
  onHideCustomCenter,
  onCustomCenterNameChange,
  onCustomCenterIdChange,
  onSaveCustomCenter,
  onGeozoneSelect,
  onGeozoneModalClose,
  geozones,
}: SelectGeozoneStepProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const tintColor = useThemeColor({}, 'tint');

  const handleGoBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onGoBack?.();
  };

  return (
    <ThemedView style={styles.container}>
      {isChangingCenter && onGoBack && (
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 10 }]}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      )}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: isChangingCenter ? insets.top + 60 : insets.top + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="title" style={styles.title}>
          {isChangingCenter
            ? 'Change Your Center'
            : locationCheckFailed
            ? 'Select Your Geozone'
            : 'Select Your Geozone'}
        </ThemedText>

        <ThemedText type="default" style={styles.description}>
          {locationCheckFailed
            ? "Your location doesn't match any geozone. Please select a geozone manually or enter a custom center for testing."
            : isChangingCenter
            ? 'Please select the geozone for your new center:'
            : "Please select the geozone where you're currently working:"}
        </ThemedText>

        {!showCustomCenter ? (
          <>
            <TouchableOpacity
              style={[styles.geozoneSelector, { borderColor: colors.cardBorder }]}
              onPress={onSelectGeozone}
            >
              <ThemedText style={styles.geozoneSelectorText}>
                {selectedGeozone ? selectedGeozone.name : 'Tap to select geozone'}
              </ThemedText>
              <MaterialIcons name="arrow-drop-down" size={24} color={colors.text} />
            </TouchableOpacity>

            {selectedGeozone && (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: tintColor }]}
                onPress={onConfirmGeozone}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="check" size={20} color="#fff" />
                    <ThemedText style={styles.buttonText}>Confirm Selection</ThemedText>
                  </>
                )}
              </TouchableOpacity>
            )}

            {locationCheckFailed && (
              <TouchableOpacity
                style={[styles.buttonSecondary, { borderColor: tintColor, marginTop: 16 }]}
                onPress={onShowCustomCenter}
                disabled={isLoading}
              >
                <MaterialIcons name="edit" size={20} color={tintColor} />
                <ThemedText style={[styles.buttonTextSecondary, { color: tintColor }]}>
                  Enter Custom Center (Testing)
                </ThemedText>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <CustomCenterForm
            centerName={customCenterName}
            centerId={customCenterId}
            isLoading={isLoading}
            onCenterNameChange={onCustomCenterNameChange}
            onCenterIdChange={onCustomCenterIdChange}
            onSave={onSaveCustomCenter}
            onBack={onHideCustomCenter}
          />
        )}

        <GeozoneModal
          visible={showGeozoneModal}
          geozones={geozones}
          selectedGeozone={selectedGeozone}
          onSelect={onGeozoneSelect}
          onClose={onGeozoneModalClose}
        />
      </ScrollView>

      {isLoading && <LoadingOverlay />}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  geozoneSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  geozoneSelectorText: {
    fontSize: 16,
    flex: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
    marginBottom: 16,
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
  },
});

