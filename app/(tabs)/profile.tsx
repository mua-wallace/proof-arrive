import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SwipeableTab } from '@/components/swipeable-tab';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DEFAULT_AGENT_ID, DEFAULT_CENTER_ID } from '@/constants/config';
import { useThemeContext } from '@/contexts/theme-context';
import { useThemeColor, useThemeColors } from '@/hooks/use-theme-color';

const TABS = ['index', 'list', 'profile'];

export default function ProfileScreen() {
  const router = useRouter();
  const tintColor = useThemeColor({}, 'tint');
  const colors = useThemeColors();
  const { themeMode, setThemeMode, isDark } = useThemeContext();
  const insets = useSafeAreaInsets();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

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

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowLogoutModal(false);
    // TODO: Clear any authentication tokens/session data here
    // Navigate to HomeScreen (root index)
    router.dismissAll();
    router.replace('/' as any);
  };

  const cancelLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowLogoutModal(false);
  };

  useEffect(() => {
    if (showLogoutModal) {
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
  }, [showLogoutModal]);

  return (
    <SwipeableTab currentTab="profile" tabs={TABS}>
      <ThemedView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top, 20),
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={true}>
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
              Account
            </ThemedText>
            <TouchableOpacity
              style={[styles.logoutButton, { borderColor: '#FF5252' }]}
              onPress={handleLogout}
              activeOpacity={0.7}>
              <MaterialIcons
                name="logout"
                size={20}
                color="#FF5252"
                style={styles.logoutIcon}
              />
              <ThemedText style={[styles.logoutButtonText, { color: '#FF5252' }]}>
                Sign Out
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ThemedView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="none"
        onRequestClose={cancelLogout}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={cancelLogout}>
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
            onStartShouldSetResponder={() => true}>
            <View style={[styles.modalIconContainer, { backgroundColor: '#FF5252' + '15' }]}>
              <MaterialIcons name="logout" size={28} color="#FF5252" />
            </View>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Sign Out
            </ThemedText>
            <ThemedText style={styles.modalMessage}>
              Are you sure you want to sign out?{'\n'}
              You'll need to sign in again to access your account.
            </ThemedText>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonCancel,
                  { borderColor: colors.cardBorder },
                ]}
                onPress={cancelLogout}
                activeOpacity={0.7}>
                <ThemedText style={styles.modalButtonCancelText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmLogout}
                activeOpacity={0.8}>
                <ThemedText style={styles.modalButtonConfirmText} lightColor="#fff" darkColor="#fff">
                  Sign Out
                </ThemedText>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </SwipeableTab>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
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
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
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
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 20,
  },
  modalMessage: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  modalButtonCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtonConfirm: {
    backgroundColor: '#FF5252',
  },
  modalButtonConfirmText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

