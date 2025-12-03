import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor, useThemeColors } from '@/hooks/use-theme-color';
import { useLocationPermissions } from '@/hooks/use-location-permissions';
import { getCurrentCenter, saveCurrentCenter } from '@/services/center-info';
import { getCenterByZoneId } from '@/services/center-service';
import { findZoneForLocation, getStoredZones } from '@/services/geozone-service';
import { getCurrentLocation } from '@/services/location';
import type { ParsedZone } from '@/types/geozone';
import { parseErrorMessage } from '@/utils/error-handler';
import { logger } from '@/utils/logger';

type SetupStep = 'permission' | 'checking' | 'select-geozone' | 'custom-center' | 'saving' | 'complete';

export default function CenterSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const tintColor = useThemeColor({}, 'tint');

  const [step, setStep] = useState<SetupStep>('permission');
  const [geozones, setGeozones] = useState<ParsedZone[]>([]);
  const [selectedGeozone, setSelectedGeozone] = useState<ParsedZone | null>(null);
  const [showGeozoneModal, setShowGeozoneModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChangingCenter, setIsChangingCenter] = useState(false);
  const [locationCheckFailed, setLocationCheckFailed] = useState(false);
  const [showCustomCenter, setShowCustomCenter] = useState(false);
  const [customCenterName, setCustomCenterName] = useState('');
  const [customCenterId, setCustomCenterId] = useState('');

  const { requestForegroundPermission, checkForegroundPermission } = useLocationPermissions();

  useEffect(() => {
    // Load geozones for dropdown
    loadGeozones();
    // Check if this is a change request (user came from profile)
    // If center is set but user navigated here, allow them to change it
    // Otherwise, if center is not set, proceed with setup
    checkExistingCenter();
  }, []);

  const checkExistingCenter = async () => {
    try {
      const center = await getCurrentCenter();
      if (center) {
        logger.log(`✅ Center already set: ${center.name} (ID: ${center.id})`);
        // If center is set, this is a change request
        setIsChangingCenter(true);
        // Skip permission step and go directly to geozone selection
        setStep('select-geozone');
      } else {
        logger.log('📍 No center set, proceeding with setup');
        // No center set, proceed with permission request
        setIsChangingCenter(false);
      }
    } catch (error) {
      logger.error('Error checking existing center:', parseErrorMessage(error));
    }
  };

  const loadGeozones = async () => {
    try {
      const zones = await getStoredZones();
      if (zones.length > 0) {
        setGeozones(zones);
        logger.log(`✅ Loaded ${zones.length} geozones for selection`);
      } else {
        logger.warn('⚠️  No geozones found in database');
        Toast.show({
          type: 'error',
          text1: 'No Geozones Available',
          text2: 'Please ensure geozones are loaded. You may need to log in again.',
        });
      }
    } catch (error) {
      logger.error('Error loading geozones:', parseErrorMessage(error));
      Toast.show({
        type: 'error',
        text1: 'Error Loading Geozones',
        text2: parseErrorMessage(error),
      });
    }
  };

  const handleRequestPermission = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    setIsLoading(true);
    try {
      // Check current permission status first
      await checkForegroundPermission();
      
      // Request permission
      const granted = await requestForegroundPermission();
      
      if (granted) {
        logger.log('✅ Location permission granted');
        // Proceed to check location
        await checkLocationAndGeozone();
      } else {
        logger.warn('⚠️  Location permission denied');
        // If permission denied, show geozone selection
        setLocationCheckFailed(true);
        setStep('select-geozone');
      }
    } catch (error) {
      logger.error('Error requesting permission:', parseErrorMessage(error));
      Toast.show({
        type: 'error',
        text1: 'Permission Error',
        text2: parseErrorMessage(error),
      });
      // Fallback to manual selection
      setLocationCheckFailed(true);
      setStep('select-geozone');
    } finally {
      setIsLoading(false);
    }
  };

  const checkLocationAndGeozone = async () => {
    setStep('checking');
    setIsLoading(true);

    try {
      logger.log('📍 Getting current location...');
      const location = await getCurrentLocation();

      logger.log(`📍 Location obtained: (${location.latitude}, ${location.longitude})`);

      // Check if location matches a geozone
      const matchResult = await findZoneForLocation(location);

      if (matchResult.found && matchResult.zone) {
        logger.log(`✅ Found geozone: ${matchResult.zone.name} (ID: ${matchResult.zone.id})`);

        // Get center from geozone
        const center = await getCenterByZoneId(matchResult.zone.id);

        if (center) {
          logger.log(`✅ Found center: ${center.name} (ID: ${center.id})`);
          // Save center and complete setup
          await saveCenterAndComplete(center);
        } else {
          logger.warn('⚠️  No center found for geozone, showing selection');
          setLocationCheckFailed(true);
          Toast.show({
            type: 'info',
            text1: 'No Center Found',
            text2: 'Please select your geozone manually or enter a custom center.',
          });
          setStep('select-geozone');
        }
      } else {
        logger.warn('⚠️  Location does not match any geozone, showing selection');
        setLocationCheckFailed(true);
        Toast.show({
          type: 'info',
          text1: 'Location Not in Geozone',
          text2: 'Please select your geozone manually or enter a custom center.',
        });
        setStep('select-geozone');
      }
    } catch (error) {
      logger.error('Error checking location:', parseErrorMessage(error));
      Toast.show({
        type: 'error',
        text1: 'Location Error',
        text2: parseErrorMessage(error),
      });
      // Fallback to manual selection
      setLocationCheckFailed(true);
      setStep('select-geozone');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectGeozone = (geozone: ParsedZone) => {
    setSelectedGeozone(geozone);
    setShowGeozoneModal(false);
    logger.log(`✅ Selected geozone: ${geozone.name} (ID: ${geozone.id})`);
  };

  const handleConfirmGeozone = async () => {
    if (!selectedGeozone) {
      Toast.show({
        type: 'error',
        text1: 'Selection Required',
        text2: 'Please select a geozone.',
      });
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    try {
      // Get center from selected geozone
      const center = await getCenterByZoneId(selectedGeozone.id);

      if (center) {
        logger.log(`✅ Found center for selected geozone: ${center.name} (ID: ${center.id})`);
        await saveCenterAndComplete(center);
      } else {
        logger.error('❌ No center found for selected geozone');
        Toast.show({
          type: 'error',
          text1: 'Center Not Found',
          text2: 'No center found for the selected geozone. You can try another geozone or enter a custom center.',
        });
        // Allow user to enter custom center if geozone doesn't work
        setShowCustomCenter(true);
      }
    } catch (error) {
      logger.error('Error getting center from geozone:', parseErrorMessage(error));
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: parseErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveCenterAndComplete = async (center: any) => {
    setStep('saving');
    setIsLoading(true);

    try {
      await saveCurrentCenter(center);
      logger.log('✅ Center saved successfully');
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Toast.show({
        type: 'success',
        text1: 'Center Set Successfully',
        text2: `Welcome to ${center.name}!`,
      });

      // Small delay to show success message
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Navigate to main app
      router.replace('/(tabs)' as any);
    } catch (error) {
      logger.error('Error saving center:', parseErrorMessage(error));
      Toast.show({
        type: 'error',
        text1: 'Save Error',
        text2: parseErrorMessage(error),
      });
      setIsLoading(false);
      setStep('select-geozone');
    }
  };

  const renderPermissionStep = () => (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconContainer}>
          <MaterialIcons name="location-on" size={80} color={tintColor} />
        </View>

        <ThemedText type="title" style={styles.title}>
          Location Access Required
        </ThemedText>

        <ThemedText type="default" style={styles.description}>
          ProofArrive needs access to your location to determine which center you're working at.
        </ThemedText>

        <ThemedText type="default" style={styles.description}>
          This helps us:
        </ThemedText>

        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <MaterialIcons name="check-circle" size={20} color={tintColor} />
            <ThemedText style={styles.benefitText}>Automatically detect your center</ThemedText>
          </View>
          <View style={styles.benefitItem}>
            <MaterialIcons name="check-circle" size={20} color={tintColor} />
            <ThemedText style={styles.benefitText}>Show relevant incoming vehicles</ThemedText>
          </View>
          <View style={styles.benefitItem}>
            <MaterialIcons name="check-circle" size={20} color={tintColor} />
            <ThemedText style={styles.benefitText}>Track vehicle locations accurately</ThemedText>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: tintColor }]}
          onPress={handleRequestPermission}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="location-on" size={20} color="#fff" />
              <ThemedText style={styles.buttonText}>Grant Location Access</ThemedText>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );

  const renderCheckingStep = () => (
    <ThemedView style={styles.container}>
      <View style={[styles.content, styles.centerContent, { paddingTop: insets.top + 100 }]}>
        <ActivityIndicator size="large" color={tintColor} />
        <ThemedText type="title" style={styles.title}>
          Checking Location...
        </ThemedText>
        <ThemedText type="default" style={styles.description}>
          Determining your center based on your current location.
        </ThemedText>
      </View>
    </ThemedView>
  );

  const handleSaveCustomCenter = async () => {
    if (!customCenterName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Center Name Required',
        text2: 'Please enter a center name.',
      });
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    try {
      // Create a custom center object for testing
      const customCenter = {
        id: customCenterId ? parseInt(customCenterId, 10) : 9999, // Use custom ID or default test ID
        name: customCenterName.trim(),
        fullname: customCenterName.trim(),
        geozone: 'Custom (Testing)',
        manager: undefined,
        gzone_id: 0,
        groupname: 'Testing',
      };

      logger.log(`✅ Saving custom center: ${customCenter.name} (ID: ${customCenter.id})`);
      await saveCenterAndComplete(customCenter);
    } catch (error) {
      logger.error('Error saving custom center:', parseErrorMessage(error));
      Toast.show({
        type: 'error',
        text1: 'Save Error',
        text2: parseErrorMessage(error),
      });
      setIsLoading(false);
    }
  };

  const renderSelectGeozoneStep = () => (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="title" style={styles.title}>
          {isChangingCenter ? 'Change Your Center' : locationCheckFailed ? 'Select Your Geozone' : 'Select Your Geozone'}
        </ThemedText>

        <ThemedText type="default" style={styles.description}>
          {locationCheckFailed
            ? 'Your location doesn\'t match any geozone. Please select a geozone manually or enter a custom center for testing.'
            : isChangingCenter
            ? 'Please select the geozone for your new center:'
            : 'Please select the geozone where you\'re currently working:'}
        </ThemedText>

        {!showCustomCenter ? (
          <>
            <TouchableOpacity
              style={[styles.geozoneSelector, { borderColor: colors.border }]}
              onPress={() => setShowGeozoneModal(true)}
            >
              <ThemedText style={styles.geozoneSelectorText}>
                {selectedGeozone ? selectedGeozone.name : 'Tap to select geozone'}
              </ThemedText>
              <MaterialIcons name="arrow-drop-down" size={24} color={colors.text} />
            </TouchableOpacity>

            {selectedGeozone && (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: tintColor }]}
                onPress={handleConfirmGeozone}
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
                onPress={() => setShowCustomCenter(true)}
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
          <View style={styles.customCenterContainer}>
            <ThemedText type="subtitle" style={styles.customCenterTitle}>
              Custom Center (Testing Only)
            </ThemedText>
            <ThemedText type="default" style={styles.customCenterDescription}>
              Enter a custom center name for testing purposes. This will not be synced with the server.
            </ThemedText>

            <View style={[styles.inputContainer, { borderColor: colors.border }]}>
              <MaterialIcons name="business" size={20} color={colors.text} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter center name"
                placeholderTextColor={colors.text + '80'}
                value={customCenterName}
                onChangeText={setCustomCenterName}
                autoCapitalize="words"
              />
            </View>

            <View style={[styles.inputContainer, { borderColor: colors.border }]}>
              <MaterialIcons name="tag" size={20} color={colors.text} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Center ID (optional, default: 9999)"
                placeholderTextColor={colors.text + '80'}
                value={customCenterId}
                onChangeText={setCustomCenterId}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: tintColor, marginTop: 16 }]}
              onPress={handleSaveCustomCenter}
              disabled={isLoading || !customCenterName.trim()}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="save" size={20} color="#fff" />
                  <ThemedText style={styles.buttonText}>Save Custom Center</ThemedText>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.buttonSecondary, { borderColor: colors.border, marginTop: 12 }]}
              onPress={() => {
                setShowCustomCenter(false);
                setCustomCenterName('');
                setCustomCenterId('');
              }}
              disabled={isLoading}
            >
              <ThemedText style={[styles.buttonTextSecondary, { color: colors.text }]}>
                Back to Geozone Selection
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        <Modal
          visible={showGeozoneModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowGeozoneModal(false)}
        >
          <View style={styles.modalOverlay}>
            <ThemedView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText type="title" style={styles.modalTitle}>
                  Select Geozone
                </ThemedText>
                <TouchableOpacity
                  onPress={() => setShowGeozoneModal(false)}
                  style={styles.modalCloseButton}
                >
                  <MaterialIcons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <FlatList
                data={geozones}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.geozoneItem,
                      selectedGeozone?.id === item.id && { backgroundColor: tintColor + '20' },
                    ]}
                    onPress={() => handleSelectGeozone(item)}
                  >
                    <ThemedText
                      style={[
                        styles.geozoneItemText,
                        selectedGeozone?.id === item.id && { color: tintColor, fontWeight: 'bold' },
                      ]}
                    >
                      {item.name}
                    </ThemedText>
                    {selectedGeozone?.id === item.id && (
                      <MaterialIcons name="check" size={20} color={tintColor} />
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <ThemedText style={styles.emptyText}>No geozones available</ThemedText>
                }
              />
            </ThemedView>
          </View>
        </Modal>
      </ScrollView>
    </ThemedView>
  );

  const renderSavingStep = () => (
    <ThemedView style={styles.container}>
      <View style={[styles.content, styles.centerContent, { paddingTop: insets.top + 100 }]}>
        <ActivityIndicator size="large" color={tintColor} />
        <ThemedText type="title" style={styles.title}>
          Setting Up Center...
        </ThemedText>
        <ThemedText type="default" style={styles.description}>
          Please wait while we configure your center.
        </ThemedText>
      </View>
    </ThemedView>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {step === 'permission' && renderPermissionStep()}
      {step === 'checking' && renderCheckingStep()}
      {(step === 'select-geozone' || step === 'custom-center') && renderSelectGeozoneStep()}
      {step === 'saving' && renderSavingStep()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
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
  benefitsList: {
    marginBottom: 32,
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
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
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 4,
  },
  geozoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  geozoneItemText: {
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
  },
  customCenterContainer: {
    marginTop: 8,
  },
  customCenterTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  customCenterDescription: {
    fontSize: 14,
    marginBottom: 20,
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    minHeight: 50,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
});

