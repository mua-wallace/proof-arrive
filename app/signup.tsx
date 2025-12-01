import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor, useThemeColors } from '@/hooks/use-theme-color';

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const tintColor = useThemeColor({}, 'tint');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const lastNameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleSignup = async () => {
    if (!firstName.trim()) {
      Alert.alert('Required', 'Please enter your first name');
      return;
    }

    if (!lastName.trim()) {
      Alert.alert('Required', 'Please enter your last name');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Required', 'Please enter your email');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Required', 'Please enter your password');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert(
        'Weak Password',
        'Password must be at least 6 characters long'
      );
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement actual signup
      // For now, simulate a signup delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success modal with haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccessModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.replace('/login');
  };

  const isFormValid = () => {
    return (
      firstName.trim() &&
      lastName.trim() &&
      email.trim() &&
      validateEmail(email) &&
      password.trim() &&
      validatePassword(password)
    );
  };

  return (
    <>
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
              Create Account
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Sign up to get started
            </ThemedText>
          </ThemedView>

          {/* Form */}
          <ThemedView style={styles.form}>
            <ThemedView style={styles.nameRow}>
              <ThemedView style={[styles.nameInput, { marginRight: 8 }]}>
                <ThemedText style={styles.label}>First Name</ThemedText>
                <ThemedView
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.cardBorder,
                    },
                  ]}>
                  <MaterialIcons
                    name="person-outline"
                    size={20}
                    color={colors.icon}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="First name"
                    placeholderTextColor={colors.text + '60'}
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                    returnKeyType="next"
                    editable={!isLoading}
                    onSubmitEditing={() => lastNameInputRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </ThemedView>
              </ThemedView>

              <ThemedView style={[styles.nameInput, { marginLeft: 8 }]}>
                <ThemedText style={styles.label}>Last Name</ThemedText>
                <ThemedView
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.cardBorder,
                    },
                  ]}>
                  <MaterialIcons
                    name="person-outline"
                    size={20}
                    color={colors.icon}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    ref={lastNameInputRef}
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Last name"
                    placeholderTextColor={colors.text + '60'}
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                    returnKeyType="next"
                    editable={!isLoading}
                    onSubmitEditing={() => emailInputRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </ThemedView>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>Email</ThemedText>
              <ThemedView
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.cardBorder,
                  },
                ]}>
                <MaterialIcons
                  name="email"
                  size={20}
                  color={colors.icon}
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={emailInputRef}
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.text + '60'}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  returnKeyType="next"
                  editable={!isLoading}
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>Password</ThemedText>
              <ThemedView
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.cardBorder,
                  },
                ]}>
                <MaterialIcons
                  name="lock-outline"
                  size={20}
                  color={colors.icon}
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={passwordInputRef}
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Create a password (min. 6 characters)"
                  placeholderTextColor={colors.text + '60'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleSignup}
                  editable={!isLoading}
                />
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
              </ThemedView>
              <ThemedText style={styles.hint}>
                Password must be at least 6 characters
              </ThemedText>
            </ThemedView>

            <TouchableOpacity
              style={[
                styles.signupButton,
                {
                  backgroundColor: isFormValid() ? tintColor : colors.disabled,
                },
                !isFormValid() && styles.buttonDisabled,
              ]}
              onPress={handleSignup}
              disabled={!isFormValid() || isLoading}
              activeOpacity={0.8}>
              <ThemedText style={styles.signupButtonText} lightColor="#fff" darkColor="#fff">
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>

          {/* Login Link */}
          <ThemedView style={styles.footer}>
            <ThemedText style={styles.footerText}>
              Already have an account?{' '}
            </ThemedText>
            <TouchableOpacity
              onPress={() => router.push('/login')}
              activeOpacity={0.7}>
              <ThemedText style={[styles.footerLink, { color: tintColor }]}>
                Sign In
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>

    {/* Success Modal */}
    <Modal
      visible={showSuccessModal}
      transparent
      animationType="fade"
      onRequestClose={handleSuccessModalClose}>
      <View style={styles.modalOverlay}>
        <ThemedView style={styles.successModalContent}>
          <View style={[styles.successIconContainer, { backgroundColor: '#4CAF50' + '20' }]}>
            <MaterialIcons name="check-circle" size={72} color="#4CAF50" />
          </View>

          <ThemedText type="title" style={styles.successModalTitle}>
            Account Created!
          </ThemedText>

          <ThemedText style={styles.successModalMessage}>
            Your account has been created successfully. You can now sign in to continue using ProofArrive.
          </ThemedText>

          <TouchableOpacity
            style={[styles.successModalButton, { backgroundColor: tintColor }]}
            onPress={handleSuccessModalClose}
            activeOpacity={0.8}>
            <ThemedText style={styles.successModalButtonText} lightColor="#fff" darkColor="#fff">
              Sign In
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </View>
    </Modal>
    </>
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
    marginBottom: 32,
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
  nameRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  nameInput: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
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
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: 4,
    marginLeft: 8,
  },
  hint: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
    marginLeft: 4,
  },
  signupButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  signupButtonText: {
    fontSize: 18,
    fontWeight: '600',
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
  // Success Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successModalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successModalTitle: {
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '700',
  },
  successModalMessage: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  successModalButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  successModalButtonText: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

