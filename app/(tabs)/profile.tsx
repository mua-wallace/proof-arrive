import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SwipeableTab } from '@/components/swipeable-tab';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeContext } from '@/contexts/theme-context';
import { useThemeColor, useThemeColors } from '@/hooks/use-theme-color';
import { AuthService } from '@/services/auth-service';
import { AuthStorageService } from '@/services/auth-storage';
import { getCurrentCenter } from '@/services/center-info';
import { getCenterFromLocation } from '@/services/geozone-service';
import { getCurrentLocation } from '@/services/location';
import { parseErrorMessage } from '@/utils/error-handler';
import { logger } from '@/utils/logger';

const TABS = ['index', 'list', 'profile'];

export default function ProfileScreen() {
  const router = useRouter();
  const tintColor = useThemeColor({}, 'tint');
  const colors = useThemeColors();
  const { themeMode, setThemeMode, isDark } = useThemeContext();
  const insets = useSafeAreaInsets();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [username, setUsername] = useState<string>('');
  const [userFullName, setUserFullName] = useState<string>('');
  const [centerName, setCenterName] = useState<string>('Not determined');
  const [centerManager, setCenterManager] = useState<string>('Not determined');
  const [centerGeozone, setCenterGeozone] = useState<string>('Not determined');
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
    
    try {
      // Logout from API and clear local data
      await AuthService.logout();
      // Navigate to HomeScreen (root index)
      router.dismissAll();
      router.replace('/' as any);
    } catch (error) {
      logger.error('Logout error:', parseErrorMessage(error));
      // Even if logout fails, navigate to home
      router.dismissAll();
      router.replace('/' as any);
    }
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

  useEffect(() => {
    async function loadUserInfo() {
      try {
        const credentials = await AuthStorageService.getCredentials();
        if (credentials) {
          setUsername(credentials.loginUsername);
          setUserFullName(credentials.fullName || credentials.loginUsername);
          
          // Get center info from storage (reusable, no API call needed)
          try {
            const center = await getCurrentCenter();
            
            if (center) {
              setCenterName(center.name || 'Not determined');
              setCenterManager(center.manager || 'Not determined');
              setCenterGeozone(center.geozone || 'Not determined');
            } else {
              // Fallback: try to get from location if not in storage
              logger.log('📍 [Profile] No center in storage, attempting to get from location...');
              try {
                const location = await getCurrentLocation();
                const locationCenter = await getCenterFromLocation({
                  latitude: location.latitude,
                  longitude: location.longitude,
                  accuracy: location.accuracy,
                  timestamp: location.timestamp,
                });
                
                if (locationCenter) {
                  setCenterName(locationCenter.name || 'Not determined');
                  setCenterManager(locationCenter.manager || 'Not determined');
                  setCenterGeozone(locationCenter.geozone || 'Not determined');
                } else {
                  setCenterName('Not determined');
                  setCenterManager('Not determined');
                  setCenterGeozone('Not determined');
                }
              } catch (locationError) {
                logger.error('Failed to get center from location:', parseErrorMessage(locationError));
                setCenterName('Not determined');
                setCenterManager('Not determined');
                setCenterGeozone('Not determined');
              }
            }
          } catch (centerError) {
            logger.error('Failed to get center info:', parseErrorMessage(centerError));
            setCenterName('Not determined');
            setCenterManager('Not determined');
            setCenterGeozone('Not determined');
          }
        }
      } catch (error) {
        logger.error('Failed to load user info:', parseErrorMessage(error));
      }
    }
    
    loadUserInfo();
  }, []);

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
                {userFullName ? userFullName.charAt(0).toUpperCase() : username ? username.charAt(0).toUpperCase() : 'A'}
              </ThemedText>
            </View>
            <ThemedText type="title" style={styles.name}>
              {userFullName || username || 'Agent'}
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              User Information
            </ThemedText>
            {username ? (
              <View style={[styles.infoRow, { borderBottomColor: colors.divider }]}>
                <ThemedText style={styles.infoLabel}>Username:</ThemedText>
                <ThemedText style={styles.infoValue}>{username}</ThemedText>
              </View>
            ) : null}
            {userFullName ? (
              <View style={[styles.infoRow, { borderBottomColor: colors.divider }]}>
                <ThemedText style={styles.infoLabel}>Name:</ThemedText>
                <ThemedText style={styles.infoValue}>{userFullName}</ThemedText>
              </View>
            ) : null}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Center Information
              </ThemedText>
              <TouchableOpacity
                onPress={() => router.push('/center-setup' as any)}
                style={[styles.changeButton, { borderColor: tintColor }]}
              >
                <MaterialIcons name="edit" size={16} color={tintColor} />
                <ThemedText style={[styles.changeButtonText, { color: tintColor }]}>
                  Change
                </ThemedText>
              </TouchableOpacity>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: colors.divider }]}>
              <ThemedText style={styles.infoLabel}>Center:</ThemedText>
              <ThemedText style={styles.infoValue}>{centerName}</ThemedText>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: colors.divider }]}>
              <ThemedText style={styles.infoLabel}>Manager:</ThemedText>
              <ThemedText style={styles.infoValue}>{centerManager}</ThemedText>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: colors.divider }]}>
              <ThemedText style={styles.infoLabel}>Geozone:</ThemedText>
              <ThemedText style={styles.infoValue}>{centerGeozone}</ThemedText>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  name: {
    marginBottom: 0,
    fontSize: 18,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  changeButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 13,
    opacity: 0.7,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 11,
    opacity: 0.6,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  logoutIcon: {
    marginRight: 6,
  },
  logoutButtonText: {
    fontSize: 14,
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
    maxWidth: 300,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    marginBottom: 6,
    textAlign: 'center',
    fontSize: 18,
  },
  modalMessage: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  modalButtonCancelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalButtonConfirm: {
    backgroundColor: '#FF5252',
  },
  modalButtonConfirmText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

