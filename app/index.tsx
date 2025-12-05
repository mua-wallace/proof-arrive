import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor, useThemeColors } from '@/hooks/use-theme-color';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const tintColor = useThemeColor({}, 'tint');

  // Animation values for background icons
  const vehicle1Anim = useRef(new Animated.Value(0)).current;
  const vehicle2Anim = useRef(new Animated.Value(0)).current;
  const vehicle3Anim = useRef(new Animated.Value(0)).current;
  const agentAnim = useRef(new Animated.Value(0)).current;
  const qrCodeAnim = useRef(new Animated.Value(0)).current;
  const malambiTextAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create floating animations for background icons
    const createFloatingAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      );
    };

    Animated.parallel([
      createFloatingAnimation(vehicle1Anim, 0),
      createFloatingAnimation(vehicle2Anim, 500),
      createFloatingAnimation(vehicle3Anim, 1000),
      createFloatingAnimation(agentAnim, 200),
      createFloatingAnimation(qrCodeAnim, 700),
      createFloatingAnimation(malambiTextAnim, 300),
    ]).start();
  }, []);

  const vehicle1TranslateY = vehicle1Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const vehicle2TranslateY = vehicle2Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const vehicle3TranslateY = vehicle3Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  const agentTranslateY = agentAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -18],
  });

  const qrCodeTranslateY = qrCodeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -16],
  });

  const malambiTextTranslateY = malambiTextAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -14],
  });

  return (
    <ThemedView style={styles.container}>
      {/* Background Icons */}
      <View style={styles.backgroundIcons}>
        {/* Vehicle Icons */}
        <Animated.View
          style={[
            styles.backgroundIcon,
            styles.vehicle1,
            {
              transform: [{ translateY: vehicle1TranslateY }],
              opacity: 0.15,
            },
          ]}>
          <MaterialIcons name="directions-car" size={80} color={tintColor} />
        </Animated.View>

        <Animated.View
          style={[
            styles.backgroundIcon,
            styles.vehicle2,
            {
              transform: [{ translateY: vehicle2TranslateY }],
              opacity: 0.12,
            },
          ]}>
          <MaterialIcons name="local-shipping" size={70} color={tintColor} />
        </Animated.View>

        <Animated.View
          style={[
            styles.backgroundIcon,
            styles.vehicle3,
            {
              transform: [{ translateY: vehicle3TranslateY }],
              opacity: 0.1,
            },
          ]}>
          <MaterialIcons name="airport-shuttle" size={65} color={tintColor} />
        </Animated.View>

        {/* Agent Icon */}
        <Animated.View
          style={[
            styles.backgroundIcon,
            styles.agentIcon,
            {
              transform: [{ translateY: agentTranslateY }],
              opacity: 0.2,
            },
          ]}>
          <MaterialIcons name="person" size={60} color={tintColor} />
        </Animated.View>

        {/* QR Code Icon */}
        <Animated.View
          style={[
            styles.backgroundIcon,
            styles.qrCodeIcon,
            {
              transform: [{ translateY: qrCodeTranslateY }],
              opacity: 0.18,
            },
          ]}>
          <MaterialIcons name="qr-code" size={55} color={tintColor} />
        </Animated.View>

        {/* Malambi Sarl Text */}
        <Animated.View
          style={[
            styles.backgroundIcon,
            styles.malambiTextContainer,
            {
              transform: [{ translateY: malambiTextTranslateY }],
              opacity: 0.1,
            },
          ]}>
          <ThemedText
            style={[styles.malambiSarlText, { color: tintColor }]}
            lightColor={tintColor}
            darkColor={tintColor}>
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
    top: '15%',
    left: '10%',
  },
  vehicle2: {
    top: '25%',
    right: '8%',
  },
  vehicle3: {
    bottom: '30%',
    left: '5%',
  },
  agentIcon: {
    top: '50%',
    right: '12%',
  },
  qrCodeIcon: {
    bottom: '45%',
    right: '15%',
  },
  malambiTextContainer: {
    top: '60%',
    left: '8%',
  },
  malambiSarlText: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 1.5,
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
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  title: {
    textAlign: 'center',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 0.2,
    marginTop: 4,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'transparent',
    marginBottom: 12,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  featureDescription: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignSelf: 'stretch',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    marginTop: 8,
  },
  getStartedButtonText: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 10,
    letterSpacing: 0.8,
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

