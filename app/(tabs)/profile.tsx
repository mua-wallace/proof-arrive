import { StyleSheet, View, TouchableOpacity, ScrollView, Switch } from 'react-native';
import * as Haptics from 'expo-haptics';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor, useThemeColors } from '@/hooks/use-theme-color';
import { useThemeContext } from '@/contexts/theme-context';
import { DEFAULT_CENTER_ID, DEFAULT_AGENT_ID } from '@/constants/config';
import { SwipeableTab } from '@/components/swipeable-tab';

const TABS = ['index', 'list', 'profile'];

export default function ProfileScreen() {
  const tintColor = useThemeColor({}, 'tint');
  const colors = useThemeColors();
  const { themeMode, setThemeMode, isDark } = useThemeContext();
  const insets = useSafeAreaInsets();

  const handleSync = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Implement sync functionality
    // await checkAndSync();
  };

  const handleThemeToggle = async (value: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newMode = value ? 'dark' : 'light';
    await setThemeMode(newMode);
  };

  return (
    <SwipeableTab currentTab="profile" tabs={TABS}>
      <ThemedView style={styles.container}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top, 24),
              paddingBottom: Math.max(insets.bottom, 24),
            },
          ]}
          showsVerticalScrollIndicator={false}>
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
          <View style={[styles.infoRow, { borderBottomColor: colors.divider }]}>
            <ThemedText style={styles.infoLabel}>Agent ID:</ThemedText>
            <ThemedText style={styles.infoValue}>{DEFAULT_AGENT_ID}</ThemedText>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: colors.divider }]}>
            <ThemedText style={styles.infoLabel}>Center ID:</ThemedText>
            <ThemedText style={styles.infoValue}>{DEFAULT_CENTER_ID}</ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Appearance
          </ThemedText>
          <View style={[styles.settingRow, { borderBottomColor: colors.divider }]}>
            <View style={styles.settingLeft}>
              <MaterialIcons
                name={isDark ? 'dark-mode' : 'light-mode'}
                size={20}
                color={tintColor}
                style={styles.settingIcon}
              />
              <View style={styles.settingTextContainer}>
                <ThemedText style={styles.settingLabel}>Dark Mode</ThemedText>
                <ThemedText style={styles.settingDescription}>
                  {themeMode === 'auto' ? 'Following system' : themeMode === 'dark' ? 'Enabled' : 'Disabled'}
                </ThemedText>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={handleThemeToggle}
              trackColor={{ false: colors.cardBorder, true: tintColor + '80' }}
              thumbColor={isDark ? tintColor : '#f4f3f4'}
            />
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
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    opacity: 0.6,
  },
});

