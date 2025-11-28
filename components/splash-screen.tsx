import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, useColorScheme, View } from 'react-native';

export function CustomSplashScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const logoFadeAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
  const messageFadeAnim = useRef(new Animated.Value(1)).current; // Start visible so users can read immediately

  useEffect(() => {
    // Logo animation - quick fade in
    Animated.parallel([
      Animated.timing(logoFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(logoScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Message is already visible (opacity 1), but we can add a subtle fade-in for polish
    // This ensures the message is readable immediately for the full 10 seconds
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#151718' : '#E6F4FE',
        },
      ]}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: logoFadeAnim,
            transform: [{ scale: logoScaleAnim }],
          },
        ]}>
        <View style={styles.logoContainer}>
          <View
            style={[
              styles.logoCircle,
              {
                backgroundColor: isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(10, 126, 164, 0.1)',
              },
            ]}>
            <Text style={[styles.logoText, { color: isDark ? '#4FC3F7' : '#0a7ea4' }]}>
              PA
            </Text>
          </View>
        </View>
        <Text
          style={[
            styles.title,
            {
              color: isDark ? '#ECEDEE' : '#0a7ea4',
            },
          ]}>
          ProofArrive
        </Text>
        <Animated.View
          style={[
            styles.messageContainer,
            {
              opacity: messageFadeAnim,
            },
          ]}>
          <Text
            style={[
              styles.message,
              {
                color: isDark ? '#9BA1A6' : '#5A7A8A',
              },
            ]}>
            Streamline vehicle management{'\n'}from arrival to departure
          </Text>
          <Text
            style={[
              styles.description,
              {
                color: isDark ? '#6B7280' : '#7A8A9A',
              },
            ]}>
            Scan QR codes, track processing,{'\n'}and manage vehicle exits efficiently
          </Text>
        </Animated.View>
        <View style={styles.loadingContainer}>
          <View
            style={[
              styles.loadingDot,
              {
                backgroundColor: isDark ? '#4FC3F7' : '#0a7ea4',
              },
            ]}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    width: '100%',
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(10, 126, 164, 0.2)',
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 2,
  },
  title: {
    fontSize: 38,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  messageContainer: {
    marginTop: 8,
    marginBottom: 40,
    paddingHorizontal: 24,
    maxWidth: '90%',
  },
  message: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400',
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.6,
  },
});

