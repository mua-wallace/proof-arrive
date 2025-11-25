import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { DEFAULT_CENTER_ID, DEFAULT_AGENT_ID } from '@/constants/config';
import { SwipeableTab } from '@/components/swipeable-tab';

const TABS = ['index', 'list', 'profile'];

export default function ProfileScreen() {
  const tintColor = useThemeColor({}, 'tint');

  const handleSync = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Implement sync functionality
    // await checkAndSync();
  };

  return (
    <SwipeableTab currentTab="profile" tabs={TABS}>
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: tintColor + '20' }]}>
            <ThemedText style={styles.avatarText} lightColor={tintColor} darkColor={tintColor}>
              {DEFAULT_AGENT_ID.charAt(0)}
            </ThemedText>
          </View>
          <ThemedText type="title" style={styles.name}>
            Agent Profile
          </ThemedText>
          <ThemedText style={styles.agentId}>{DEFAULT_AGENT_ID}</ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Information
          </ThemedText>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Agent ID:</ThemedText>
            <ThemedText style={styles.infoValue}>{DEFAULT_AGENT_ID}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Center ID:</ThemedText>
            <ThemedText style={styles.infoValue}>{DEFAULT_CENTER_ID}</ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Actions
          </ThemedText>
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: tintColor }]}
            onPress={handleSync}
            activeOpacity={0.7}>
            <ThemedText style={[styles.actionButtonText, { color: tintColor }]}>
              Sync Pending Records
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            About
          </ThemedText>
          <ThemedText style={styles.aboutText}>
            ProofArrive v1.0.0{'\n'}
            Vehicle arrival tracking system
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
    </SwipeableTab>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  name: {
    marginBottom: 4,
  },
  agentId: {
    fontSize: 14,
    opacity: 0.7,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  infoLabel: {
    fontSize: 14,
    opacity: 0.7,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  aboutText: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 22,
  },
});

