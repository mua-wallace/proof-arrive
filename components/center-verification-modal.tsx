/**
 * Center Verification Modal
 * Shows a modal when user tries to perform an action but is not in their setup center
 */

import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor, useThemeColors } from '@/hooks/use-theme-color';
import type { RawCenterData } from '@/types/center';

interface CenterVerificationModalProps {
  visible: boolean;
  setupCenter: RawCenterData | null;
  currentCenter: RawCenterData | null;
  onClose: () => void;
  onModifyCenter: () => void;
}

export function CenterVerificationModal({
  visible,
  setupCenter,
  currentCenter,
  onClose,
  onModifyCenter,
}: CenterVerificationModalProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const tintColor = useThemeColor({}, 'tint');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  const handleModifyCenter = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    onModifyCenter();
    router.push('/center-setup' as any);
  };

  const handleCancel = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleCancel}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={handleCancel}
      >
        <Animated.View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.background,
              borderColor: colors.cardBorder,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#FF9800' + '15' }]}>
            <MaterialIcons name="location-off" size={32} color="#FF9800" />
          </View>

          <ThemedText type="title" style={styles.title}>
            Not in Setup Center
          </ThemedText>

          <ThemedText style={styles.message}>
            You cannot perform this action because you are not currently at your setup center.
          </ThemedText>

          {setupCenter && (
            <View style={[styles.infoBox, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <View style={styles.infoRow}>
                <MaterialIcons name="business" size={16} color={colors.text} style={{ opacity: 0.7 }} />
                <ThemedText style={styles.infoLabel}>Setup Center:</ThemedText>
                <ThemedText style={styles.infoValue}>{setupCenter.name}</ThemedText>
              </View>
            </View>
          )}

          {currentCenter && (
            <View style={[styles.infoBox, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <View style={styles.infoRow}>
                <MaterialIcons name="my-location" size={16} color={colors.text} style={{ opacity: 0.7 }} />
                <ThemedText style={styles.infoLabel}>Current Location:</ThemedText>
                <ThemedText style={styles.infoValue}>{currentCenter.name}</ThemedText>
              </View>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary, { borderColor: colors.cardBorder }]}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <ThemedText style={[styles.buttonText, { color: colors.text }]}>Cancel</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary, { backgroundColor: tintColor }]}
              onPress={handleModifyCenter}
              activeOpacity={0.8}
            >
              <MaterialIcons name="edit-location" size={18} color="#fff" />
              <ThemedText style={[styles.buttonText, { color: '#fff', marginLeft: 6 }]}>
                Change Center
              </ThemedText>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
    opacity: 0.8,
  },
  infoBox: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    opacity: 0.7,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  buttonPrimary: {
    borderWidth: 0,
  },
  buttonSecondary: {
    // Already has border from button style
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});



