/**
 * Geozone Selection Modal Component
 */

import React from 'react';
import { FlatList, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor, useThemeColors } from '@/hooks/use-theme-color';
import type { ParsedZone } from '@/types/geozone';

interface GeozoneModalProps {
  visible: boolean;
  geozones: ParsedZone[];
  selectedGeozone: ParsedZone | null;
  onSelect: (geozone: ParsedZone) => void;
  onClose: () => void;
}

export function GeozoneModal({
  visible,
  geozones,
  selectedGeozone,
  onSelect,
  onClose,
}: GeozoneModalProps) {
  const colors = useThemeColors();
  const tintColor = useThemeColor({}, 'tint');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <ThemedView style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <ThemedText type="title" style={styles.modalTitle}>
              Select Geozone
            </ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
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
                onPress={() => onSelect(item)}
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
  );
}

const styles = StyleSheet.create({
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
});

