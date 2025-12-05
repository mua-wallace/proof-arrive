import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, PixelRatio, StyleSheet, Text, useColorScheme, View } from 'react-native';

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Calculate responsive scale factor based on screen size
// Base scale for a standard phone (375x812 - iPhone X)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;
const scale = Math.min(SCREEN_WIDTH / BASE_WIDTH, SCREEN_HEIGHT / BASE_HEIGHT);
const fontScale = PixelRatio.getFontScale();

// Responsive font size function
const scaleFont = (size: number) => {
  const scaledSize = size * scale;
  // Normalize font scale to prevent too large/small fonts
  const normalizedFontScale = Math.max(0.8, Math.min(1.2, fontScale));
  return Math.round(scaledSize * normalizedFontScale);
};

// Responsive spacing function
const scaleSpacing = (size: number) => {
  return Math.round(size * scale);
};

export function CustomSplashScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const slideAnim = useRef(new Animated.Value(0)).current;
  const titleFadeAnim = useRef(new Animated.Value(1)).current; // Start fully visible
  const subtitleFadeAnim = useRef(new Animated.Value(1)).current; // Start fully visible
  const featuresFadeAnim = useRef(new Animated.Value(1)).current; // Start fully visible

  useEffect(() => {
    // Subtle entrance animation - text is immediately visible, just add gentle slide
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#151718' : '#E6F4FE',
        },
      ]}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: titleFadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}>
          <Text
            style={[
              styles.title,
              {
                color: isDark ? '#ECEDEE' : '#0a7ea4',
              },
            ]}>
            ProofArrive
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.subtitleContainer,
            {
              opacity: subtitleFadeAnim,
            },
          ]}>
          <Text
            style={[
              styles.subtitle,
              {
                color: isDark ? '#9BA1A6' : '#5A7A8A',
              },
            ]}>
            Complete Vehicle Management Solution
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.featuresContainer,
            {
              opacity: featuresFadeAnim,
            },
          ]}>
          <View style={styles.featureItem}>
            <Text style={[styles.bullet, { color: isDark ? '#4FC3F7' : '#0a7ea4' }]}>•</Text>
            <Text
              style={[
                styles.featureText,
                {
                  color: isDark ? '#B0B5BA' : '#6B7A8A',
                },
              ]}>
              Scan QR codes to record vehicle arrivals
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Text style={[styles.bullet, { color: isDark ? '#4FC3F7' : '#0a7ea4' }]}>•</Text>
            <Text
              style={[
                styles.featureText,
                {
                  color: isDark ? '#B0B5BA' : '#6B7A8A',
                },
              ]}>
              Track processing stages in real-time
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Text style={[styles.bullet, { color: isDark ? '#4FC3F7' : '#0a7ea4' }]}>•</Text>
            <Text
              style={[
                styles.featureText,
                {
                  color: isDark ? '#B0B5BA' : '#6B7A8A',
                },
              ]}>
              Manage vehicle exits with detailed records
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Text style={[styles.bullet, { color: isDark ? '#4FC3F7' : '#0a7ea4' }]}>•</Text>
            <Text
              style={[
                styles.featureText,
                {
                  color: isDark ? '#B0B5BA' : '#6B7A8A',
                },
              ]}>
              Maintain comprehensive vehicle history
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Powered by Malambi */}
      <View style={styles.poweredByContainer}>
        <Text style={[styles.poweredByText, { color: isDark ? '#9BA1A6' : '#6B7A8A' }]}>
          Powered by{' '}
        </Text>
        <Text style={[styles.malambiText, { color: isDark ? '#4FC3F7' : '#0a7ea4' }]}>
          Malambi
        </Text>
        <MaterialIcons
          name="bolt"
          size={scaleFont(14)}
          color={isDark ? '#4FC3F7' : '#0a7ea4'}
          style={styles.boltIcon}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scaleSpacing(40),
    zIndex: 9999,
  },
  content: {
    width: '100%',
    maxWidth: scaleSpacing(600),
    alignItems: 'center',
  },
  titleContainer: {
    marginBottom: scaleSpacing(24),
  },
  title: {
    fontSize: scaleFont(40), // Responsive title size
    fontWeight: '700',
    letterSpacing: 0.8,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  subtitleContainer: {
    marginBottom: scaleSpacing(36),
  },
  subtitle: {
    fontSize: scaleFont(17), // Responsive subtitle size
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2,
    lineHeight: scaleFont(24),
    includeFontPadding: false,
    paddingHorizontal: scaleSpacing(16),
  },
  featuresContainer: {
    width: '100%',
    alignItems: 'flex-start',
    paddingHorizontal: scaleSpacing(8),
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: scaleSpacing(18),
    paddingRight: scaleSpacing(16),
  },
  bullet: {
    fontSize: scaleFont(16), // Responsive bullet size, slightly larger than feature text
    fontWeight: '600',
    marginRight: scaleSpacing(12),
    marginTop: scaleSpacing(2),
    lineHeight: scaleFont(20),
    includeFontPadding: false,
  },
  featureText: {
    fontSize: scaleFont(14), // Responsive feature text size
    lineHeight: scaleFont(20),
    fontWeight: '400',
    flex: 1,
    letterSpacing: 0.15,
    includeFontPadding: false,
  },
  poweredByContainer: {
    position: 'absolute',
    bottom: scaleSpacing(40),
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleSpacing(16),
  },
  poweredByText: {
    fontSize: scaleFont(11),
    fontWeight: '400',
    letterSpacing: 0.3,
    includeFontPadding: false,
  },
  malambiText: {
    fontSize: scaleFont(12),
    fontWeight: '600',
    letterSpacing: 0.5,
    includeFontPadding: false,
  },
  boltIcon: {
    marginLeft: scaleSpacing(4),
  },
});

