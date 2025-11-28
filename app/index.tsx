import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor, useThemeColors } from '@/hooks/use-theme-color';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const tintColor = useThemeColor({}, 'tint');

  return (
    <ThemedView style={styles.container}>
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
        </ThemedView>

        {/* Brief Message */}
        <ThemedView
          style={[
            styles.messageCard,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.cardBorder,
              shadowColor: tintColor,
            },
          ]}>
          <MaterialIcons
            name="directions-car"
            size={32}
            color={tintColor}
            style={styles.cardIcon}
          />
          <ThemedText style={styles.cardText}>
            Streamline vehicle management from arrival to departure. Scan QR codes,
            track processing, and manage exits efficiently.
          </ThemedText>
        </ThemedView>

        {/* Sign In Button */}
        <TouchableOpacity
          style={[
            styles.loginButton,
            {
              backgroundColor: tintColor,
              shadowColor: tintColor,
            },
          ]}
          onPress={() => router.push('/login')}
          activeOpacity={0.8}>
          <ThemedText style={styles.loginButtonText} lightColor="#fff" darkColor="#fff">
            Sign In
          </ThemedText>
          <MaterialIcons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
        </TouchableOpacity>

        {/* Sign Up Link */}
        <ThemedView style={styles.footer}>
          <ThemedText style={styles.footerText}>
            Don't have an account?{' '}
          </ThemedText>
          <TouchableOpacity
            onPress={() => router.push('/signup')}
            activeOpacity={0.7}>
            <ThemedText style={[styles.footerLink, { color: tintColor }]}>
              Sign Up
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  title: {
    textAlign: 'center',
  },
  messageCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 36,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardIcon: {
    marginBottom: 16,
  },
  cardText: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.85,
    fontWeight: '400',
    flexWrap: 'wrap',
    width: '100%',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    alignSelf: 'stretch',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: '600',
    marginRight: 8,
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 15,
    opacity: 0.7,
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '600',
  },
});

