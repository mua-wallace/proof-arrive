import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { OperationType } from '@/types/arrival';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function OperationTypeScreen() {
  const params = useLocalSearchParams();
  const [selectedType, setSelectedType] = useState<OperationType | null>(null);
  const tintColor = useThemeColor({}, 'tint');

  const handleSelect = async (type: OperationType) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedType(type);
  };

  const handleConfirm = async () => {
    if (!selectedType) return;

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    router.push({
      pathname: '/confirm',
      params: {
        ...params,
        operationType: selectedType,
      },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Select Operation Type
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        Choose the purpose of this vehicle's visit
      </ThemedText>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[
            styles.option,
            selectedType === 'loading' && { borderColor: tintColor, borderWidth: 3 },
          ]}
          onPress={() => handleSelect('loading')}
          activeOpacity={0.7}>
          <ThemedText type="subtitle" style={styles.optionTitle}>
            Loading
          </ThemedText>
          <ThemedText style={styles.optionDescription}>
            Vehicle receives cargo
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.option,
            selectedType === 'unloading' && { borderColor: tintColor, borderWidth: 3 },
          ]}
          onPress={() => handleSelect('unloading')}
          activeOpacity={0.7}>
          <ThemedText type="subtitle" style={styles.optionTitle}>
            Unloading
          </ThemedText>
          <ThemedText style={styles.optionDescription}>
            Vehicle delivers cargo
          </ThemedText>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.confirmButton,
          { backgroundColor: selectedType ? tintColor : '#ccc' },
          !selectedType && styles.confirmButtonDisabled,
        ]}
        onPress={handleConfirm}
        disabled={!selectedType}
        activeOpacity={0.8}>
        <ThemedText style={styles.confirmButtonText} lightColor="#fff" darkColor="#fff">
          Confirm
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 48,
    opacity: 0.7,
    fontSize: 16,
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  option: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  optionTitle: {
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    opacity: 0.7,
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

