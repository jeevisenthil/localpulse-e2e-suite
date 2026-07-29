import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, KeyboardAvoidingView, Platform, StatusBar, Dimensions,
  ScrollView, Alert
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../config/theme';
import apiService from '../services/api';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ onLogin }) {
  const [view, setView] = useState('SIGN_IN'); // 'SIGN_IN' | 'SIGN_UP' | 'VERIFICATION' | 'FORGOT_PASSWORD'

  // Loading & error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Sign In inputs
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Register inputs
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('Resident'); // 'Resident' | 'Admin'

  // Verification states
  const [verifyUserId, setVerifyUserId] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [hintOtp, setHintOtp] = useState(''); // helper to show OTP for testing

  // Forgot password inputs
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [hintResetCode, setHintResetCode] = useState('');
  const [resetCodeRequested, setResetCodeRequested] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const clearMessages = () => {
    setError('');
    setSuccessMessage('');
  };

  const handleSignIn = async () => {
    clearMessages();
    if (!username.trim() || !password.trim()) {
      setError('Please enter username and password');
      return;
    }

    setLoading(true);
    const res = await apiService.login({ username: username.trim(), password: password.trim() });
    setLoading(false);

    if (res.success) {
      onLogin(res.data);
    } else if (res.notVerified) {
      setVerifyUserId(res.userId);
      const otps = `Email OTP: ${res.emailOtp} | Phone OTP: ${res.phoneOtp}`;
      setHintOtp(otps);
      setError('Account is not verified yet. Please enter the OTP codes.');
      setView('VERIFICATION');
      Alert.alert(
        '🔑 Verification OTP Code (Demo)',
        `This account is not verified yet.\n\n📧 Email OTP: ${res.emailOtp}\n📱 Phone OTP: ${res.phoneOtp}`,
        [{ text: 'Use Codes' }]
      );
    } else {
      setError(res.error || 'Invalid credentials');
    }
  };

  const handleRegister = async () => {
    clearMessages();
    if (!regUsername.trim() || !regEmail.trim() || !regPhone.trim() || !regPassword.trim()) {
      setError('All fields are required');
      return;
    }

    if (regPassword.length < 3) {
      setError('Password must be at least 3 characters');
      return;
    }

    // Auto-prepend +91 if number is plain
    let formattedPhone = regPhone.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+91' + formattedPhone;
    }

    setLoading(true);
    const res = await apiService.register({
      username: regUsername.trim(),
      email: regEmail.trim(),
      phone: formattedPhone,
      password: regPassword.trim(),
      role: regRole,
    });
    setLoading(false);

    if (res.success) {
      setVerifyUserId(res.data.userId);
      const otps = `Email OTP: ${res.data.emailOtp} | Phone OTP: ${res.data.phoneOtp}`;
      setHintOtp(otps);
      setSuccessMessage(`Registration successful! Verify your email/phone.`);
      setView('VERIFICATION');
      Alert.alert(
        '🔑 Verification OTP Code (Demo)',
        `For presentation purposes, here are your OTP codes:\n\n📧 Email OTP: ${res.data.emailOtp}\n📱 Phone OTP: ${res.data.phoneOtp}`,
        [{ text: 'Use Codes' }]
      );
    } else {
      setError(res.error || 'Failed to register account');
    }
  };

  const handleVerifyOtp = async () => {
    clearMessages();
    if (!emailOtp.trim() || !phoneOtp.trim()) {
      setError('Please enter both OTP codes');
      return;
    }

    setLoading(true);
    const res = await apiService.verifyOtp({
      userId: verifyUserId,
      emailOtp: emailOtp.trim(),
      phoneOtp: phoneOtp.trim(),
    });
    setLoading(false);

    if (res.success) {
      setSuccessMessage('Account verified successfully!');
      setTimeout(() => {
        onLogin(res.data);
      }, 1000);
    } else {
      setError(res.error || 'Invalid verification codes');
    }
  };

  const handleRequestResetOtp = async () => {
    clearMessages();
    if (!forgotEmail.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    const res = await apiService.forgotPassword(forgotEmail.trim());
    setLoading(false);

    if (res.success) {
      const resetMsg = `Reset OTP Code: ${res.data.resetOtp}`;
      setHintResetCode(resetMsg);
      setSuccessMessage('Reset code generated successfully!');
      setResetCodeRequested(true);
      Alert.alert(
        '🔑 Password Reset Code (Demo)',
        `Your password reset code is:\n\n${res.data.resetOtp}`,
        [{ text: 'Use Code' }]
      );
    } else {
      setError(res.error || 'Email address not found');
    }
  };

  const handleResetPassword = async () => {
    clearMessages();
    if (!resetCode.trim() || !newPassword.trim()) {
      setError('Please enter the reset code and new password');
      return;
    }

    setLoading(true);
    const res = await apiService.resetPassword({
      email: forgotEmail.trim(),
      resetOtp: resetCode.trim(),
      newPassword: newPassword.trim(),
    });
    setLoading(false);

    if (res.success) {
      setSuccessMessage('Password reset successfully! Please login.');
      setTimeout(() => {
        setView('SIGN_IN');
        setResetCodeRequested(false);
        setPassword('');
        clearMessages();
      }, 1500);
    } else {
      setError(res.error || 'Invalid reset code');
    }
  };

  const navigateToView = (newView) => {
    clearMessages();
    setView(newView);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgDark} />

      {/* Decorative gradient circles */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />
      <View style={styles.decorCircle3} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={{ width: '100%' }}
        >
          <Animated.View
            style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          >
            {/* Logo */}
            <Animated.View style={[styles.logoContainer, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.logoEmoji}>📍</Text>
            </Animated.View>

            <Text style={styles.appTitle}>LocalPulse</Text>
            <Text style={styles.subtitle}>Community Notice Board</Text>

            {/* CARD CONTAINER */}
            <View style={styles.card}>
              {/* ==================== VIEW 1: SIGN IN ==================== */}
              {view === 'SIGN_IN' && (
                <>
                  <Text style={styles.cardTitle}>Sign In</Text>
                  <Text style={styles.cardSubtitle}>Access your colony's notice board</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Username, Email, or Phone</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter credentials"
                      placeholderTextColor={Colors.textMuted}
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor={Colors.textMuted}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoCapitalize="none"
                    />
                  </View>

                  {error ? <View style={styles.errorBox}><Text style={styles.errorText}>⚠️ {error}</Text></View> : null}

                  <TouchableOpacity
                    style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                    onPress={handleSignIn}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.loginBtnText}>{loading ? 'Verifying...' : 'Sign In →'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => navigateToView('FORGOT_PASSWORD')}>
                    <Text style={styles.linkText}>Forgot Password?</Text>
                  </TouchableOpacity>

                  <View style={styles.divider} />

                  <TouchableOpacity onPress={() => navigateToView('SIGN_UP')}>
                    <Text style={[styles.linkText, { marginTop: 0 }]}>Don't have an account? Sign Up</Text>
                  </TouchableOpacity>

                  {/* Demo account helper */}
                  <View style={styles.hintBox}>
                    <Text style={styles.hintTitle}>Demo Credentials</Text>
                    <Text style={styles.hintText}>Admin: admin / 123 (Auto-ID: ADM-1111)</Text>
                    <Text style={styles.hintText}>Resident: resident / 1234 (Auto-ID: RES-2222)</Text>
                  </View>
                </>
              )}

              {/* ==================== VIEW 2: SIGN UP ==================== */}
              {view === 'SIGN_UP' && (
                <>
                  <Text style={styles.cardTitle}>Register</Text>
                  <Text style={styles.cardSubtitle}>Create your community account</Text>

                  {/* Role Selector */}
                  <Text style={styles.label}>Register As</Text>
                  <View style={styles.roleSelector}>
                    <TouchableOpacity
                      style={[styles.roleBtn, regRole === 'Resident' && styles.roleBtnActive]}
                      onPress={() => setRegRole('Resident')}
                    >
                      <Text style={[styles.roleBtnText, regRole === 'Resident' && styles.roleBtnTextActive]}>
                        Resident
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.roleBtn, regRole === 'Admin' && styles.roleBtnActive]}
                      onPress={() => setRegRole('Admin')}
                    >
                      <Text style={[styles.roleBtnText, regRole === 'Admin' && styles.roleBtnTextActive]}>
                        Admin
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Username</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. jeevi_99"
                      placeholderTextColor={Colors.textMuted}
                      value={regUsername}
                      onChangeText={setRegUsername}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="name@email.com"
                      placeholderTextColor={Colors.textMuted}
                      value={regEmail}
                      onChangeText={setRegEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phone Number</Text>
                    <View style={styles.phoneInputContainer}>
                      <View style={styles.countryCodeBox}>
                        <Text style={styles.countryCodeText}>+91</Text>
                      </View>
                      <TextInput
                        style={[styles.input, styles.phoneInput]}
                        placeholder="98765xxxxx"
                        placeholderTextColor={Colors.textMuted}
                        value={regPhone}
                        onChangeText={setRegPhone}
                        keyboardType="phone-pad"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Create Password</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Min 3 characters"
                      placeholderTextColor={Colors.textMuted}
                      value={regPassword}
                      onChangeText={setRegPassword}
                      secureTextEntry
                      autoCapitalize="none"
                    />
                  </View>

                  {error ? <View style={styles.errorBox}><Text style={styles.errorText}>⚠️ {error}</Text></View> : null}

                  <TouchableOpacity
                    style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                    onPress={handleRegister}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.loginBtnText}>{loading ? 'Creating...' : 'Register Account →'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => navigateToView('SIGN_IN')}>
                    <Text style={styles.linkText}>Already have an account? Sign In</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* ==================== VIEW 3: OTP VERIFICATION ==================== */}
              {view === 'VERIFICATION' && (
                <>
                  <Text style={styles.cardTitle}>Verify Security</Text>
                  <Text style={styles.cardSubtitle}>Verification required for Email and Phone</Text>

                  {successMessage ? (
                    <View style={[styles.errorBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
                      <Text style={[styles.errorText, { color: Colors.primaryLight }]}>✅ {successMessage}</Text>
                    </View>
                  ) : null}

                  <View style={styles.otpContainer}>
                    <View style={styles.otpInputGroup}>
                      <Text style={styles.label}>Email Code (OTP)</Text>
                      <TextInput
                        style={[styles.input, { textAlign: 'center', letterSpacing: 2 }]}
                        placeholder="123456"
                        placeholderTextColor={Colors.textMuted}
                        value={emailOtp}
                        onChangeText={setEmailOtp}
                        keyboardType="number-pad"
                        maxLength={6}
                      />
                    </View>

                    <View style={styles.otpInputGroup}>
                      <Text style={styles.label}>Phone Code (OTP)</Text>
                      <TextInput
                        style={[styles.input, { textAlign: 'center', letterSpacing: 2 }]}
                        placeholder="123456"
                        placeholderTextColor={Colors.textMuted}
                        value={phoneOtp}
                        onChangeText={setPhoneOtp}
                        keyboardType="number-pad"
                        maxLength={6}
                      />
                    </View>
                  </View>

                  {error ? <View style={styles.errorBox}><Text style={styles.errorText}>⚠️ {error}</Text></View> : null}

                  <TouchableOpacity
                    style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                    onPress={handleVerifyOtp}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.loginBtnText}>{loading ? 'Verifying...' : 'Verify OTPs →'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => navigateToView('SIGN_IN')}>
                    <Text style={styles.linkText}>Cancel & Go Back</Text>
                  </TouchableOpacity>

                  {/* Simulator Helper */}
                  {hintOtp ? (
                    <View style={styles.hintBox}>
                      <Text style={styles.hintTitle}>Simulator OTP codes</Text>
                      <Text style={styles.hintText}>{hintOtp}</Text>
                    </View>
                  ) : null}
                </>
              )}

              {/* ==================== VIEW 4: FORGOT PASSWORD ==================== */}
              {view === 'FORGOT_PASSWORD' && (
                <>
                  <Text style={styles.cardTitle}>Reset Account</Text>
                  <Text style={styles.cardSubtitle}>
                    {!resetCodeRequested ? 'Request a secure password reset link' : 'Reset your account password'}
                  </Text>

                  {successMessage ? (
                    <View style={[styles.errorBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
                      <Text style={[styles.errorText, { color: Colors.primaryLight }]}>✅ {successMessage}</Text>
                    </View>
                  ) : null}

                  {!resetCodeRequested ? (
                    // Request Reset Form
                    <>
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Registered Email Address</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="name@email.com"
                          placeholderTextColor={Colors.textMuted}
                          value={forgotEmail}
                          onChangeText={setForgotEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>

                      {error ? <View style={styles.errorBox}><Text style={styles.errorText}>⚠️ {error}</Text></View> : null}

                      <TouchableOpacity
                        style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                        onPress={handleRequestResetOtp}
                        disabled={loading}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.loginBtnText}>{loading ? 'Generating...' : 'Send Reset Code →'}</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    // Reset Password Form
                    <>
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Reset Code (OTP)</Text>
                        <TextInput
                          style={[styles.input, { textAlign: 'center', letterSpacing: 2 }]}
                          placeholder="123456"
                          placeholderTextColor={Colors.textMuted}
                          value={resetCode}
                          onChangeText={setResetCode}
                          keyboardType="number-pad"
                          maxLength={6}
                        />
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Enter New Password</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Min 3 characters"
                          placeholderTextColor={Colors.textMuted}
                          value={newPassword}
                          onChangeText={setNewPassword}
                          secureTextEntry
                          autoCapitalize="none"
                        />
                      </View>

                      {error ? <View style={styles.errorBox}><Text style={styles.errorText}>⚠️ {error}</Text></View> : null}

                      <TouchableOpacity
                        style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                        onPress={handleResetPassword}
                        disabled={loading}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.loginBtnText}>{loading ? 'Resetting...' : 'Change Password →'}</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  <TouchableOpacity onPress={() => { navigateToView('SIGN_IN'); setResetCodeRequested(false); }}>
                    <Text style={styles.linkText}>Back to Sign In</Text>
                  </TouchableOpacity>

                  {/* Reset Code Simulator Helper */}
                  {hintResetCode && resetCodeRequested ? (
                    <View style={styles.hintBox}>
                      <Text style={styles.hintTitle}>Simulator Reset code</Text>
                      <Text style={styles.hintText}>{hintResetCode}</Text>
                    </View>
                  ) : null}
                </>
              )}
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  decorCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    top: -80,
    right: -60,
  },
  decorCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(6, 182, 212, 0.06)',
    bottom: 100,
    left: -50,
  },
  decorCircle3: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    top: height * 0.35,
    right: -30,
  },
  keyboardView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.primaryFaded,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  logoEmoji: {
    fontSize: 36,
  },
  appTitle: {
    fontSize: FontSize.hero,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
    marginTop: Spacing.xs,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  cardTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Platform.OS === 'ios' ? Spacing.md + 2 : Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  errorBox: {
    backgroundColor: Colors.urgentBg,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorText: {
    color: Colors.urgentLight,
    fontSize: FontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  loginBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  linkText: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  roleSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  roleBtnActive: {
    backgroundColor: Colors.primary,
  },
  roleBtnText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  roleBtnTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  otpContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  otpInputGroup: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.lg,
  },
  hintBox: {
    marginTop: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
  },
  hintTitle: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primaryLight,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hintText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  countryCodeBox: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.md + 2 : Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryCodeText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
  },
});
