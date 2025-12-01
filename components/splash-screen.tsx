import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, useColorScheme, View } from 'react-native';

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
    paddingHorizontal: 40,
    zIndex: 9999,
  },
  content: {
    width: '100%',
    maxWidth: 600,
    alignItems: 'center',
  },
  titleContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
  },
  subtitleContainer: {
    marginBottom: 48,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 28,
  },
  featuresContainer: {
    width: '100%',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingRight: 16,
  },
  bullet: {
    fontSize: 20,
    fontWeight: '600',
    marginRight: 16,
    marginTop: 2,
    lineHeight: 24,
  },
  featureText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    flex: 1,
    letterSpacing: 0.2,
  },
});

