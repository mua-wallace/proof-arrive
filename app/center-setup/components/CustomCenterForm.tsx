/**
 * Custom Center Form Component
 * Allows users to enter a custom center for testing purposes
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor, useThemeColors } from '@/hooks/use-theme-color';

interface CustomCenterFormProps {
  centerName: string;
  centerId: string;
  isLoading: boolean;
  onCenterNameChange: (name: string) => void;
  onCenterIdChange: (id: string) => void;
  onSave: () => void;
  onBack: () => void;
}

export function CustomCenterForm({
  centerName,
  centerId,
  isLoading,
  onCenterNameChange,
  onCenterIdChange,
  onSave,
  onBack,
}: CustomCenterFormProps) {
  const colors = useThemeColors();
  const tintColor = useThemeColor({}, 'tint');

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        Custom Center (Testing Only)
      </ThemedText>
      <ThemedText type="default" style={styles.description}>
        Enter a custom center name for testing purposes. This will not be synced with the server.
      </ThemedText>

      <View style={[styles.inputContainer, { borderColor: colors.cardBorder }]}>
        <MaterialIcons name="business" size={20} color={colors.text} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Enter center name"
          placeholderTextColor={colors.text + '80'}
          value={centerName}
          onChangeText={onCenterNameChange}
          autoCapitalize="words"
        />
      </View>

      <View style={[styles.inputContainer, { borderColor: colors.cardBorder }]}>
        <MaterialIcons name="tag" size={20} color={colors.text} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Center ID (optional, default: 9999)"
          placeholderTextColor={colors.text + '80'}
          value={centerId}
          onChangeText={onCenterIdChange}
          keyboardType="numeric"
        />
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: tintColor, marginTop: 16 }]}
        onPress={onSave}
        disabled={isLoading || !centerName.trim()}
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
        style={[styles.buttonSecondary, { borderColor: colors.cardBorder, marginTop: 12 }]}
        onPress={onBack}
        disabled={isLoading}
      >
        <ThemedText style={[styles.buttonTextSecondary, { color: colors.text }]}>
          Back to Geozone Selection
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
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
});

