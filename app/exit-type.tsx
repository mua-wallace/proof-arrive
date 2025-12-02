import { useState, useRef, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, TextInput, Alert, KeyboardAvoidingView, ScrollView, Platform, Modal, FlatList } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ExitType } from '@/types/arrival';
import { useThemeColor, useThemeColors } from '@/hooks/use-theme-color';
import { getStoredCenters } from '@/services/center-service';
import type { RawCenterData } from '@/types/center';
import { logger } from '@/utils/logger';

export default function ExitTypeScreen() {
  const params = useLocalSearchParams();
  const [selectedType, setSelectedType] = useState<ExitType | null>(null);
  const [destination, setDestination] = useState('');
  const [centers, setCenters] = useState<RawCenterData[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingCenters, setLoadingCenters] = useState(false);
  const tintColor = useThemeColor({}, 'tint');
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const destinationInputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadCenters();
  }, []);

  const loadCenters = async () => {
    try {
      setLoadingCenters(true);
      const storedCenters = await getStoredCenters();
      // Sort centers by name for easier selection
      const sortedCenters = storedCenters.sort((a, b) => a.name.localeCompare(b.name));
      setCenters(sortedCenters);
      logger.log(`📋 Loaded ${sortedCenters.length} centers for destination dropdown`);
    } catch (error) {
      logger.error('Failed to load centers:', error);
      setCenters([]);
    } finally {
      setLoadingCenters(false);
    }
  };

  const handleSelect = async (type: ExitType) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedType(type);
    if (type === 'unloaded') {
      setDestination(''); // Clear destination for unloaded
    }
  };

  const handleSelectCenter = async (center: RawCenterData) => {
    setDestination(center.name);
    setShowDropdown(false);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderCenterItem = ({ item }: { item: RawCenterData }) => (
    <TouchableOpacity
      style={[
        styles.dropdownItem,
        {
          backgroundColor: colors.cardBackground,
          borderBottomColor: colors.cardBorder,
        },
      ]}
      onPress={() => handleSelectCenter(item)}
      activeOpacity={0.7}>
      <ThemedText style={styles.dropdownItemText}>{item.name}</ThemedText>
      {item.fullname !== item.name && (
        <ThemedText style={styles.dropdownItemSubtext}>{item.fullname}</ThemedText>
      )}
    </TouchableOpacity>
  );

  const handleConfirm = async () => {
    if (!selectedType) {
      Alert.alert('Selection Required', 'Please select an exit type');
      return;
    }

    if (selectedType === 'loaded' && !destination.trim()) {
      Alert.alert('Destination Required', 'Please enter a destination for loaded vehicles');
      return;
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    router.push({
      pathname: '/exit-confirm',
      params: {
        ...params,
        exitType: selectedType,
        exitDestination: selectedType === 'loaded' ? destination.trim() : '',
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      enabled>
      <ThemedView style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            { 
              paddingTop: Math.max(insets.top, 24), 
              paddingBottom: Math.max(insets.bottom, 200) // Extra padding for keyboard
            },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          bounces={true}
          contentInsetAdjustmentBehavior="automatic">
          <ThemedText type="title" style={styles.title}>
            Exit Type
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Specify how the vehicle is exiting
          </ThemedText>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.option,
                {
                  borderColor: colors.cardBorder,
                  backgroundColor: colors.cardBackground,
                },
                selectedType === 'loaded' && { borderColor: tintColor, borderWidth: 3 },
              ]}
              onPress={() => handleSelect('loaded')}
              activeOpacity={0.7}>
              <ThemedText type="subtitle" style={styles.optionTitle}>
                Loaded
              </ThemedText>
              <ThemedText style={styles.optionDescription}>
                Vehicle is leaving with cargo
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.option,
                {
                  borderColor: colors.cardBorder,
                  backgroundColor: colors.cardBackground,
                },
                selectedType === 'unloaded' && { borderColor: tintColor, borderWidth: 3 },
              ]}
              onPress={() => handleSelect('unloaded')}
              activeOpacity={0.7}>
              <ThemedText type="subtitle" style={styles.optionTitle}>
                Unloaded
              </ThemedText>
              <ThemedText style={styles.optionDescription}>
                Vehicle has delivered cargo
              </ThemedText>
            </TouchableOpacity>
          </View>

          {selectedType === 'loaded' && (
            <View style={styles.destinationContainer}>
              <ThemedText style={styles.destinationLabel}>Destination *</ThemedText>
              <TouchableOpacity
                style={[
                  styles.destinationDropdown,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.cardBorder,
                  },
                ]}
                onPress={() => {
                  if (centers.length > 0) {
                    setShowDropdown(true);
                  } else {
                    Alert.alert('No Centers', 'No centers available. Please ensure centers are loaded.');
                  }
                }}
                activeOpacity={0.7}>
                <ThemedText
                  style={[
                    styles.destinationDropdownText,
                    { color: destination ? colors.text : colors.text + '80' },
                  ]}>
                  {destination || 'Select a center...'}
                </ThemedText>
                <MaterialIcons name="arrow-drop-down" size={24} color={colors.text} />
              </TouchableOpacity>
              {destination && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setDestination('')}
                  activeOpacity={0.7}>
                  <MaterialIcons name="clear" size={18} color={colors.text + '80'} />
                  <ThemedText style={styles.clearButtonText}>Clear</ThemedText>
                </TouchableOpacity>
              )}
              <ThemedText style={styles.destinationHint}>
                Select a center from the list or enter a custom destination
              </ThemedText>
              {!destination && (
                <View style={styles.customInputContainer}>
                  <TextInput
                    ref={destinationInputRef}
                    style={[
                      styles.destinationInput,
                      {
                        backgroundColor: colors.cardBackground,
                        borderColor: colors.cardBorder,
                        color: colors.text,
                      },
                    ]}
                    placeholder="Or enter custom destination"
                    placeholderTextColor={colors.text + '80'}
                    value={destination}
                    onChangeText={setDestination}
                    autoCapitalize="words"
                    returnKeyType="done"
                    blurOnSubmit={true}
                  />
                </View>
              )}
            </View>
          )}

          {selectedType === 'unloaded' && (
            <View style={styles.destinationContainer}>
              <ThemedText style={styles.destinationLabel}>Next Center (Optional)</ThemedText>
              <TouchableOpacity
                style={[
                  styles.destinationDropdown,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.cardBorder,
                  },
                ]}
                onPress={() => {
                  if (centers.length > 0) {
                    setShowDropdown(true);
                  } else {
                    Alert.alert('No Centers', 'No centers available. Please ensure centers are loaded.');
                  }
                }}
                activeOpacity={0.7}>
                <ThemedText
                  style={[
                    styles.destinationDropdownText,
                    { color: destination ? colors.text : colors.text + '80' },
                  ]}>
                  {destination || 'Select a center (optional)...'}
                </ThemedText>
                <MaterialIcons name="arrow-drop-down" size={24} color={colors.text} />
              </TouchableOpacity>
              {destination && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setDestination('')}
                  activeOpacity={0.7}>
                  <MaterialIcons name="clear" size={18} color={colors.text + '80'} />
                  <ThemedText style={styles.clearButtonText}>Clear</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Center Selection Dropdown Modal */}
          <Modal
            visible={showDropdown}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowDropdown(false)}>
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowDropdown(false)}>
              <ThemedView
                style={[
                  styles.modalContent,
                  {
                    backgroundColor: colors.background,
                    maxHeight: '70%',
                    paddingBottom: insets.bottom,
                  },
                ]}
                onStartShouldSetResponder={() => true}>
                <View style={styles.modalHeader}>
                  <ThemedText type="subtitle" style={styles.modalTitle}>
                    Select Center
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => setShowDropdown(false)}
                    style={styles.modalCloseButton}
                    activeOpacity={0.7}>
                    <MaterialIcons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                {loadingCenters ? (
                  <View style={styles.modalLoading}>
                    <ThemedText>Loading centers...</ThemedText>
                  </View>
                ) : centers.length === 0 ? (
                  <View style={styles.modalLoading}>
                    <ThemedText>No centers available</ThemedText>
                  </View>
                ) : (
                  <FlatList
                    data={centers}
                    renderItem={renderCenterItem}
                    keyExtractor={(item) => item.id.toString()}
                    style={styles.dropdownList}
                    showsVerticalScrollIndicator={true}
                  />
                )}
              </ThemedView>
            </TouchableOpacity>
          </Modal>

          <TouchableOpacity
            style={[
              styles.confirmButton,
              { backgroundColor: selectedType ? tintColor : colors.disabled },
              !selectedType && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirm}
            disabled={!selectedType}
            activeOpacity={0.8}>
            <ThemedText style={styles.confirmButtonText} lightColor="#fff" darkColor="#fff">
              Continue
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'flex-start',
    minHeight: '100%',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.7,
    fontSize: 16,
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  option: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  optionTitle: {
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  destinationContainer: {
    marginBottom: 24,
  },
  destinationLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  destinationDropdown: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  destinationDropdownText: {
    fontSize: 16,
    flex: 1,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 8,
    gap: 4,
  },
  clearButtonText: {
    fontSize: 14,
    opacity: 0.7,
  },
  customInputContainer: {
    marginTop: 8,
  },
  destinationInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 4,
  },
  destinationHint: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalLoading: {
    padding: 24,
    alignItems: 'center',
  },
  dropdownList: {
    maxHeight: 400,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dropdownItemSubtext: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  confirmButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

