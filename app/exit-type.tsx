import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, TextInput, Alert, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ExitType } from '@/types/arrival';
import { useThemeColor, useThemeColors } from '@/hooks/use-theme-color';

export default function ExitTypeScreen() {
  const params = useLocalSearchParams();
  const [selectedType, setSelectedType] = useState<ExitType | null>(null);
  const [destination, setDestination] = useState('');
  const tintColor = useThemeColor({}, 'tint');
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const handleSelect = async (type: ExitType) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedType(type);
    if (type === 'unloaded') {
      setDestination(''); // Clear destination for unloaded
    }
  };

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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <ThemedView style={styles.container}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 24) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
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
              <TextInput
                style={[
                  styles.destinationInput,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.cardBorder,
                    color: colors.text,
                  },
                ]}
                placeholder="Enter destination (e.g., Delivery Center, Client, Factory)"
                placeholderTextColor={colors.text + '80'}
                value={destination}
                onChangeText={setDestination}
                autoCapitalize="words"
                returnKeyType="done"
                blurOnSubmit={true}
              />
              <ThemedText style={styles.destinationHint}>
                Delivery Center, Client, Factory, or other location
              </ThemedText>
            </View>
          )}

          {selectedType === 'unloaded' && (
            <View style={styles.destinationContainer}>
              <ThemedText style={styles.destinationLabel}>Next Center (Optional)</ThemedText>
              <TextInput
                style={[
                  styles.destinationInput,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.cardBorder,
                    color: colors.text,
                  },
                ]}
                placeholder="Enter next center (optional)"
                placeholderTextColor={colors.text + '80'}
                value={destination}
                onChangeText={setDestination}
                autoCapitalize="words"
                returnKeyType="done"
                blurOnSubmit={true}
              />
            </View>
          )}

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
    justifyContent: 'center',
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

