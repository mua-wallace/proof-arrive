/**
 * Center Setup Screen
 * Main screen component for setting up or changing the user's center
 */

import React from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useCenterSetup } from './hooks/use-center-setup';
import { LoadingStep } from './components/LoadingStep';
import { PermissionStep } from './components/PermissionStep';
import { SelectGeozoneStep } from './components/SelectGeozoneStep';
import { SETUP_STEPS } from './constants';

export default function CenterSetupScreen() {
  const router = useRouter();
  const {
    step,
    geozones,
    selectedGeozone,
    showGeozoneModal,
    isLoading,
    isInitializing,
    isChangingCenter,
    locationCheckFailed,
    showCustomCenter,
    customCenterName,
    customCenterId,
    setSelectedGeozone,
    setShowGeozoneModal,
    setShowCustomCenter,
    setCustomCenterName,
    setCustomCenterId,
    handleRequestPermission,
    handleSelectGeozone,
    handleConfirmGeozone,
    handleSaveCustomCenter,
  } = useCenterSetup();

  const handleGoBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleHideCustomCenter = () => {
    setShowCustomCenter(false);
    setCustomCenterName('');
    setCustomCenterId('');
  };

  if (isInitializing) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LoadingStep
          title="Verifying..."
          message="Checking your center setup and loading geozones."
        />
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {step === SETUP_STEPS.PERMISSION && (
        <PermissionStep
          isLoading={isLoading}
          isChangingCenter={isChangingCenter}
          onRequestPermission={handleRequestPermission}
          onGoBack={isChangingCenter ? handleGoBack : undefined}
        />
      )}

      {step === SETUP_STEPS.CHECKING && (
        <LoadingStep
          title="Verifying..."
          message="Determining your center based on your current location."
        />
      )}

      {(step === SETUP_STEPS.SELECT_GEOZONE || step === SETUP_STEPS.CUSTOM_CENTER) && (
        <SelectGeozoneStep
          isChangingCenter={isChangingCenter}
          locationCheckFailed={locationCheckFailed}
          showCustomCenter={showCustomCenter}
          selectedGeozone={selectedGeozone}
          showGeozoneModal={showGeozoneModal}
          isLoading={isLoading}
          customCenterName={customCenterName}
          customCenterId={customCenterId}
          geozones={geozones}
          onGoBack={isChangingCenter ? handleGoBack : undefined}
          onSelectGeozone={() => setShowGeozoneModal(true)}
          onConfirmGeozone={handleConfirmGeozone}
          onShowCustomCenter={() => setShowCustomCenter(true)}
          onHideCustomCenter={handleHideCustomCenter}
          onCustomCenterNameChange={setCustomCenterName}
          onCustomCenterIdChange={setCustomCenterId}
          onSaveCustomCenter={handleSaveCustomCenter}
          onGeozoneSelect={handleSelectGeozone}
          onGeozoneModalClose={() => setShowGeozoneModal(false)}
        />
      )}

      {step === SETUP_STEPS.SAVING && (
        <LoadingStep
          title="Setting Up Center..."
          message="Please wait while we configure your center."
        />
      )}
    </KeyboardAvoidingView>
  );
}

