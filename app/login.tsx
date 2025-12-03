import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor, useThemeColors } from '@/hooks/use-theme-color';
import { AuthService } from '@/services/auth-service';
import { initializeCenters } from '@/services/center-service';
import { initializeGeozones, findZoneForLocation } from '@/services/geozone-service';
import { getCurrentLocation } from '@/services/location';
import { AuthError, isNetworkError, NetworkError, parseErrorMessage as parseError } from '@/utils/error-handler';
import { logger } from '@/utils/logger';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const tintColor = useThemeColor({}, 'tint');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [invalidCredentials, setInvalidCredentials] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const passwordInputRef = useRef<TextInput>(null);

  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

  const clearErrors = () => {
    setEmailError(null);
    setPasswordError(null);
    setGeneralError(null);
    setInvalidCredentials(false);
  };

  const handleEmailChange = (text: string) => {
    try {
      setEmail(text);
      if (emailError) setEmailError(null);
      if (passwordError) setPasswordError(null);
      if (generalError) setGeneralError(null);
      if (invalidCredentials) setInvalidCredentials(false);
    } catch (error) {
      // Prevent crashes from state updates
      logger.error('Error updating email:', parseError(error));
    }
  };

  const handlePasswordChange = (text: string) => {
    try {
      setPassword(text);
      if (emailError) setEmailError(null);
      if (passwordError) setPasswordError(null);
      if (generalError) setGeneralError(null);
      if (invalidCredentials) setInvalidCredentials(false);
    } catch (error) {
      // Prevent crashes from state updates
      logger.error('Error updating password:', parseError(error));
    }
  };

  const parseErrorMessage = (error: unknown): { field: 'email' | 'password' | 'general' | 'both'; message: string } => {
    const errorMessage = parseError(error);
    const lowerMessage = errorMessage.toLowerCase();

    // Handle specific error types
    if (error instanceof NetworkError || isNetworkError(error)) {
      // Use the actual error message which now includes helpful diagnostics
      return { field: 'general', message: errorMessage || 'Network error. Please check your connection and try again.' };
    }

    if (error instanceof AuthError) {
      // Check if it's a username specific error
      if (lowerMessage.includes('username') || lowerMessage.includes('user')) {
        if (!lowerMessage.includes('password') && !lowerMessage.includes('credential')) {
          return { field: 'email', message: errorMessage || 'Invalid username' };
        }
      }
      // Check if it's a password specific error
      if (lowerMessage.includes('password') && !lowerMessage.includes('username') && !lowerMessage.includes('user')) {
        return { field: 'password', message: errorMessage || 'Invalid password' };
      }
      // Default auth error - invalid credentials affects both fields
      return { field: 'both', message: 'Invalid credentials' };
    }

    // Check for specific error patterns in message
    if (lowerMessage.includes('invalid credential') || lowerMessage.includes('invalid username') || lowerMessage.includes('invalid password')) {
      return { field: 'both', message: 'Invalid credentials' };
    }
    if (lowerMessage.includes('username') || lowerMessage.includes('user')) {
      if (!lowerMessage.includes('password') && !lowerMessage.includes('credential')) {
        return { field: 'email', message: 'Invalid username' };
      }
    }
    if (lowerMessage.includes('password') && !lowerMessage.includes('username') && !lowerMessage.includes('email')) {
      return { field: 'password', message: 'Invalid password' };
    }
    if (lowerMessage.includes('timeout')) {
      return { field: 'general', message: 'Request timed out. Please try again.' };
    }

    // Default to both fields for credential errors
    if (lowerMessage.includes('credential') || lowerMessage.includes('login') || lowerMessage.includes('authentication')) {
      return { field: 'both', message: 'Invalid credentials' };
    }

    // Default to general error with user-friendly message
    return { field: 'general', message: errorMessage || 'An error occurred. Please try again.' };
  };

  const handleLogin = async () => {
    clearErrors();

    // Validate inputs
    let hasErrors = false;
    if (!email.trim()) {
      setEmailError('Username is required');
      hasErrors = true;
    }
    if (!password.trim()) {
      setPasswordError('Password is required');
      hasErrors = true;
    }

    if (hasErrors) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Scroll to first error
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setIsLoading(true);
    try {
      const user = await AuthService.login({
        username: email.trim(),
        password: password.trim(),
      });

      // AuthService.login() throws on error, so if we get here, login was successful
      try {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      } catch (hapticError) {
        // Ignore haptic errors - not critical
      }
      
      // Fetch and store geozones after successful login
      try {
        logger.log('📡 Fetching geozones for logged-in user...');
        await initializeGeozones();
        logger.log('✅ Geozones initialized successfully');
      } catch (geozoneError) {
        // Log but don't block navigation - geozones can be fetched later
        logger.error('Failed to initialize geozones:', parseError(geozoneError));
      }
      
      // Fetch and store centers after successful login
      try {
        logger.log('📡 Fetching and storing centers for logged-in user...');
        await initializeCenters();
        logger.log('✅ Centers initialized successfully');
      } catch (centerError) {
        // Log but don't block navigation - centers can be fetched later
        logger.error('Failed to initialize centers:', parseError(centerError));
      }
      
      // Check if center is already set
      const { getCurrentCenter } = await import('@/services/center-info');
      const existingCenter = await getCurrentCenter();
      
      if (existingCenter) {
        logger.log(`✅ Center already set: ${existingCenter.name} (ID: ${existingCenter.id})`);
        // Navigate to main app
        router.replace('/(tabs)');
      } else {
        // Center not set - redirect to center setup
        logger.log('📍 Center not set, redirecting to center setup...');
        router.replace('/center-setup');
      }
    } catch (error: unknown) {
      // Safely handle haptic feedback
      try {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error
        );
      } catch {
        // Ignore haptic errors
      }

      // Safely parse and display error
      try {
        const { field, message } = parseErrorMessage(error);

        if (field === 'email') {
          setEmailError(message);
          // Focus email field
          setTimeout(() => {
            try {
              scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            } catch {
              // Ignore scroll errors
            }
          }, 100);
        } else if (field === 'password') {
          setPasswordError(message);
          // Focus password field
          setTimeout(() => {
            try {
              passwordInputRef.current?.focus();
              scrollViewRef.current?.scrollTo({ y: 200, animated: true });
            } catch {
              // Ignore focus/scroll errors
            }
          }, 100);
        } else if (field === 'both') {
          // Invalid credentials - highlight both fields
          setInvalidCredentials(true);
          setPasswordError(message);
          // Scroll to password field to show error message
          setTimeout(() => {
            try {
              passwordInputRef.current?.focus();
              scrollViewRef.current?.scrollTo({ y: 200, animated: true });
            } catch {
              // Ignore focus/scroll errors
            }
          }, 100);
        } else {
          setGeneralError(message);
          // Scroll to top to show general error
          setTimeout(() => {
            try {
              scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            } catch {
              // Ignore scroll errors
            }
          }, 100);
        }
      } catch (parseError) {
        // Fallback error handling if parsing fails
        setGeneralError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      enabled>
      <ThemedView style={styles.container}>
        {/* Back Button - Fixed at top */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { top: insets.top + 8 }]}
          activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            { 
              paddingTop: insets.top + 20, 
              paddingBottom: Math.max(insets.bottom, 100) // Extra padding for keyboard
            },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentInsetAdjustmentBehavior="automatic">
          {/* Header */}
          <ThemedView style={styles.header}>
            <ThemedView
              style={[
                styles.logoContainer,
                {
                  backgroundColor: tintColor + '15',
                  borderColor: tintColor + '30',
                },
              ]}>
              <ThemedText
                style={[styles.logoText, { color: tintColor }]}
                type="title">
                PA
              </ThemedText>
            </ThemedView>
            <ThemedText type="title" style={styles.title}>
              Welcome Back
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Sign in to continue
            </ThemedText>
          </ThemedView>

          {/* General Error Message */}
          {generalError && (
            <ThemedView
              style={[
                styles.errorBanner,
                {
                  backgroundColor: '#FF5252' + '15',
                  borderColor: '#FF5252',
                },
              ]}>
              <MaterialIcons name="error-outline" size={20} color="#FF5252" />
              <ThemedText style={[styles.errorBannerText, { color: '#FF5252' }]}>
                {generalError}
              </ThemedText>
            </ThemedView>
          )}

          {/* Form */}
          <ThemedView style={styles.form}>
            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>Username</ThemedText>
              <ThemedView
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: (emailError || invalidCredentials) ? '#FF5252' : colors.cardBorder,
                    borderWidth: (emailError || invalidCredentials) ? 2 : 1,
                  },
                ]}>
                <MaterialIcons
                  name="person"
                  size={20}
                  color={(emailError || invalidCredentials) ? '#FF5252' : colors.icon}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter your username"
                  placeholderTextColor={colors.text + '60'}
                  value={email}
                  onChangeText={handleEmailChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="default"
                  returnKeyType="next"
                  editable={!isLoading}
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                  blurOnSubmit={false}
                />
                {(emailError || invalidCredentials) && (
                  <MaterialIcons name="error-outline" size={20} color="#FF5252" style={styles.errorIcon} />
                )}
              </ThemedView>
              {emailError && (
                <ThemedView style={styles.errorMessageContainer}>
                  <ThemedText style={[styles.errorMessage, { color: '#FF5252' }]}>
                    {emailError}
                  </ThemedText>
                </ThemedView>
              )}
            </ThemedView>

            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>Password</ThemedText>
              <ThemedView
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: (passwordError || invalidCredentials) ? '#FF5252' : colors.cardBorder,
                    borderWidth: (passwordError || invalidCredentials) ? 2 : 1,
                  },
                ]}>
                <MaterialIcons
                  name="lock-outline"
                  size={20}
                  color={(passwordError || invalidCredentials) ? '#FF5252' : colors.icon}
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={passwordInputRef}
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.text + '60'}
                  value={password}
                  onChangeText={handlePasswordChange}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  editable={!isLoading}
                />
                {(passwordError || invalidCredentials) ? (
                  <MaterialIcons name="error-outline" size={20} color="#FF5252" style={styles.errorIcon} />
                ) : (
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                    activeOpacity={0.7}>
                    <MaterialIcons
                      name={showPassword ? 'visibility' : 'visibility-off'}
                      size={20}
                      color={colors.icon}
                    />
                  </TouchableOpacity>
                )}
              </ThemedView>
              {passwordError && (
                <ThemedView style={styles.errorMessageContainer}>
                  <ThemedText style={[styles.errorMessage, { color: '#FF5252' }]}>
                    {passwordError}
                  </ThemedText>
                </ThemedView>
              )}
            </ThemedView>

            {/* Forgot Password Link */}
            <TouchableOpacity
              onPress={handleForgotPassword}
              style={styles.forgotPasswordContainer}
              activeOpacity={0.7}>
              <ThemedText style={[styles.forgotPasswordText, { color: tintColor }]}>
                Forgot Password?
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.loginButton,
                {
                  backgroundColor: email && password ? tintColor : colors.disabled,
                },
                (!email || !password) && styles.buttonDisabled,
              ]}
              onPress={handleLogin}
              disabled={!email || !password || isLoading}
              activeOpacity={0.8}>
              <ThemedText style={styles.loginButtonText} lightColor="#fff" darkColor="#fff">
                {isLoading ? 'Signing in...' : 'Sign In'}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    padding: 8,
    zIndex: 10,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 24,
    marginTop: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.7,
    lineHeight: 24,
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  errorIcon: {
    marginLeft: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: 4,
    marginLeft: 8,
  },
  errorMessageContainer: {
    marginTop: 6,
    marginLeft: 4,
  },
  errorMessage: {
    fontSize: 13,
    fontWeight: '500',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

