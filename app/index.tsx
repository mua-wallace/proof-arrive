import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor, useThemeColors } from '@/hooks/use-theme-color';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const tintColor = useThemeColor({}, 'tint');

  // Attractive, distinct colors for background icons
  const iconColors = {
    vehicle1: '#2196F3', // Blue - classic car color
    vehicle2: '#FF9800', // Orange - shipping/truck color
    qrCode: '#00BCD4', // Cyan - tech/digital
    malambiText: tintColor, // Theme color for text
  };

  // Animation values for subtle background movement
  const vehicle1X = useRef(new Animated.Value(0)).current;
  const vehicle1Y = useRef(new Animated.Value(0)).current;
  const vehicle2X = useRef(new Animated.Value(0)).current;
  const vehicle2Y = useRef(new Animated.Value(0)).current;
  const qrCodeX = useRef(new Animated.Value(0)).current;
  const qrCodeY = useRef(new Animated.Value(0)).current;
  const malambiTextX = useRef(new Animated.Value(0)).current;
  const malambiTextY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Calculate movement area around center - small contained area
    const movementRadiusX = SCREEN_WIDTH * 0.2; // 20% of screen width from center
    const movementRadiusY = SCREEN_HEIGHT * 0.2; // 20% of screen height from center

    // Create very slow, smooth floating animation around center
    const createSlowFloat = (
      animX: Animated.Value,
      animY: Animated.Value,
      initialDelay: number
    ) => {
      const moveToPosition = (targetX: number, targetY: number, duration: number) => {
        return Animated.parallel([
          Animated.timing(animX, {
            toValue: targetX,
            duration: duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animY, {
            toValue: targetY,
            duration: duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]);
      };

      const animate = () => {
        // Generate new random position
        const randomX = (Math.random() - 0.5) * 2 * movementRadiusX;
        const randomY = (Math.random() - 0.5) * 2 * movementRadiusY;
        
        // Very slow movement - 60 seconds per transition
        moveToPosition(randomX, randomY, 60000).start(() => {
          // Wait a bit before next movement
          setTimeout(() => {
            animate();
          }, 2000);
        });
      };

      // Initialize at center
      animX.setValue(0);
      animY.setValue(0);
      
      // Start after initial delay
      setTimeout(() => {
        animate();
      }, initialDelay);
    };

    // Start very slow floating movements
    createSlowFloat(vehicle1X, vehicle1Y, 0);
    createSlowFloat(vehicle2X, vehicle2Y, 5000);
    createSlowFloat(qrCodeX, qrCodeY, 10000);
    createSlowFloat(malambiTextX, malambiTextY, 15000);
  }, []);

  return (
    <ThemedView style={styles.container}>
      {/* Background Icons */}
      <View style={styles.backgroundIcons}>
        {/* Attractive Background Icons with Distinct Colors */}
        <Animated.View
          style={[
            styles.backgroundIcon,
            styles.vehicle1,
            {
              transform: [
                { translateX: vehicle1X },
                { translateY: vehicle1Y },
              ],
              opacity: 0.3,
            },
          ]}>
          <MaterialIcons name="directions-car" size={75} color={iconColors.vehicle1} />
        </Animated.View>

        <Animated.View
          style={[
            styles.backgroundIcon,
            styles.vehicle2,
            {
              transform: [
                { translateX: vehicle2X },
                { translateY: vehicle2Y },
              ],
              opacity: 0.28,
            },
          ]}>
          <MaterialIcons name="local-shipping" size={70} color={iconColors.vehicle2} />
        </Animated.View>

        <Animated.View
          style={[
            styles.backgroundIcon,
            styles.qrCodeIcon,
            {
              transform: [
                { translateX: qrCodeX },
                { translateY: qrCodeY },
              ],
              opacity: 0.3,
            },
          ]}>
          <MaterialIcons name="qr-code" size={65} color={iconColors.qrCode} />
        </Animated.View>

        {/* Malambi Sarl Text */}
        <Animated.View
          style={[
            styles.backgroundIcon,
            styles.malambiTextContainer,
            {
              transform: [
                { translateX: malambiTextX },
                { translateY: malambiTextY },
              ],
              opacity: 0.25,
            },
          ]}>
          <ThemedText
            style={[styles.malambiSarlText, { color: iconColors.malambiText }]}
            lightColor={iconColors.malambiText}
            darkColor={iconColors.malambiText}>
            Malambi Sarl
          </ThemedText>
        </Animated.View>
      </View>

      <View
        style={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 20),
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}>
        {/* Logo and Title */}
        <ThemedView style={styles.header}>
          <ThemedView
            style={[
              styles.logoContainer,
              {
                backgroundColor: tintColor + '20',
                borderColor: tintColor + '40',
                shadowColor: tintColor,
              },
            ]}>
            <ThemedText
              style={[styles.logoText, { color: tintColor }]}
              type="title">
              PA
            </ThemedText>
          </ThemedView>
          <ThemedText type="title" style={styles.title}>
            ProofArrive
          </ThemedText>
          <ThemedText style={styles.subtitle} lightColor="#6B7A8A" darkColor="#9BA1A6">
            Complete Vehicle Management Solution
          </ThemedText>
        </ThemedView>

        {/* Feature Highlights */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <View style={[styles.featureIconContainer, { backgroundColor: tintColor + '15' }]}>
              <MaterialIcons name="qr-code-scanner" size={24} color={tintColor} />
            </View>
            <View style={styles.featureTextContainer}>
              <ThemedText style={styles.featureTitle}>Quick Scan</ThemedText>
              <ThemedText style={styles.featureDescription} lightColor="#6B7A8A" darkColor="#9BA1A6">
                Scan QR codes instantly
              </ThemedText>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIconContainer, { backgroundColor: tintColor + '15' }]}>
              <MaterialIcons name="track-changes" size={24} color={tintColor} />
            </View>
            <View style={styles.featureTextContainer}>
              <ThemedText style={styles.featureTitle}>Real-time Tracking</ThemedText>
              <ThemedText style={styles.featureDescription} lightColor="#6B7A8A" darkColor="#9BA1A6">
                Monitor vehicle status
              </ThemedText>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIconContainer, { backgroundColor: tintColor + '15' }]}>
              <MaterialIcons name="history" size={24} color={tintColor} />
            </View>
            <View style={styles.featureTextContainer}>
              <ThemedText style={styles.featureTitle}>Complete History</ThemedText>
              <ThemedText style={styles.featureDescription} lightColor="#6B7A8A" darkColor="#9BA1A6">
                Track all vehicle records
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Get Started Button */}
        <TouchableOpacity
          style={[
            styles.getStartedButton,
            {
              backgroundColor: tintColor,
              shadowColor: tintColor,
            },
          ]}
          onPress={() => router.push('/login')}
          activeOpacity={0.85}>
          <ThemedText style={styles.getStartedButtonText} lightColor="#fff" darkColor="#fff">
            Get Started
          </ThemedText>
          <MaterialIcons name="arrow-forward" size={22} color="#fff" style={styles.buttonIcon} />
        </TouchableOpacity>
      </View>

      {/* Powered by Malambi */}
      <View style={[styles.poweredByContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <ThemedText style={styles.poweredByText} lightColor="#6B7A8A" darkColor="#9BA1A6">
          Powered by{' '}
        </ThemedText>
        <ThemedText style={[styles.malambiText, { color: tintColor }]}>
          Malambi
        </ThemedText>
        <MaterialIcons name="bolt" size={16} color={tintColor} style={styles.boltIcon} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  backgroundIcons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  backgroundIcon: {
    position: 'absolute',
  },
  vehicle1: {
    top: '50%',
    left: '50%',
    marginTop: -40, // Half of icon size to center it
    marginLeft: -40,
  },
  vehicle2: {
    top: '50%',
    left: '50%',
    marginTop: -35,
    marginLeft: -35,
  },
  qrCodeIcon: {
    top: '50%',
    left: '50%',
    marginTop: -25,
    marginLeft: -25,
  },
  malambiTextContainer: {
    top: '50%',
    left: '50%',
    marginTop: -18, // Approximate half of text height
    marginLeft: -90, // Approximate half of text width
  },
  malambiSarlText: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'stretch',
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  logoText: {
    fontSize: 38,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  title: {
    textAlign: 'center',
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.15,
    marginTop: 2,
    lineHeight: 22,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 14,
    backgroundColor: 'transparent',
    marginBottom: 14,
  },
  featureIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 5,
    letterSpacing: 0.15,
  },
  featureDescription: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    alignSelf: 'stretch',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
    marginTop: 12,
  },
  getStartedButtonText: {
    fontSize: 17,
    fontWeight: '600',
    marginRight: 8,
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  poweredByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    zIndex: 1,
  },
  poweredByText: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  malambiText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  boltIcon: {
    marginLeft: 4,
  },
});

