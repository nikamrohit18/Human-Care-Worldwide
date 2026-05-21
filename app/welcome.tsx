import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View as RNView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { firebaseErrorMessage } from '@/lib/firebaseErrors';

type LoginType = 'individual' | 'partners' | 'corporate';
type PartnerType = 'insurance' | 'hospital' | 'corporate-hr';

const LOGIN_TYPES: { id: LoginType; label: string }[] = [
  { id: 'individual', label: 'Individual\n/ Patient' },
  { id: 'partners', label: 'Partners' },
  { id: 'corporate', label: 'Corporate\nEmployee' },
];

const PARTNER_TYPES: { id: PartnerType; label: string }[] = [
  { id: 'insurance', label: 'Insurance Company' },
  { id: 'hospital', label: 'Hospital' },
  { id: 'corporate-hr', label: 'Corporate HR' },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  const { signIn } = useAuth();
  const [loginType, setLoginType] = useState<LoginType>('individual');
  const [partnerType, setPartnerType] = useState<PartnerType>('insurance');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(firebaseErrorMessage(e.code ?? ''));
    } finally {
      setSubmitting(false);
    }
  };

  const inputBg = isDark ? '#1E1E1E' : '#F5F5F5';
  const inputBorder = isDark ? '#2E2E2E' : '#E5E5E5';
  const inputColor = isDark ? '#F5F5F5' : '#1A1A1A';
  const placeholderColor = isDark ? '#555' : '#AAA';
  const dividerColor = isDark ? '#2E2E2E' : '#E5E5E5';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Logo ── */}
          <RNView style={styles.logoSection}>
            <Image
              source={require('../assets/images/hww-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.brandSub}>Global Medical Assistance</Text>
          </RNView>

          {/* ── Login Type Selector ── */}
          <RNView style={styles.section}>
            <Text style={styles.sectionLabel}>Sign in as</Text>
            <RNView style={[styles.typeRow, { backgroundColor: isDark ? '#1A1A1A' : '#EFEFEF' }]}>
              {LOGIN_TYPES.map((type) => {
                const active = loginType === type.id;
                return (
                  <TouchableOpacity
                    key={type.id}
                    style={[styles.typeTab, active && styles.typeTabActive]}
                    onPress={() => setLoginType(type.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[styles.typeTabText, active && styles.typeTabTextActive]}
                      numberOfLines={2}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </RNView>

            {/* Partner sub-type chips */}
            {loginType === 'partners' && (
              <RNView style={styles.partnerRow}>
                {PARTNER_TYPES.map((pt) => {
                  const active = partnerType === pt.id;
                  return (
                    <TouchableOpacity
                      key={pt.id}
                      style={[
                        styles.partnerChip,
                        { borderColor: active ? Colors.primary : dividerColor },
                        active && { backgroundColor: Colors.primary },
                      ]}
                      onPress={() => setPartnerType(pt.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.partnerChipText, active && { color: '#fff' }]}>
                        {pt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </RNView>
            )}
          </RNView>

          {/* ── Form ── */}
          <RNView style={styles.form}>

            {/* Email */}
            <RNView style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: inputBorder }]}>
              <FontAwesome name="envelope-o" size={15} color={placeholderColor} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: inputColor }]}
                placeholder="Email address"
                placeholderTextColor={placeholderColor}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
              />
            </RNView>

            {/* Password */}
            <RNView style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: inputBorder }]}>
              <FontAwesome name="lock" size={17} color={placeholderColor} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: inputColor }]}
                placeholder="Password"
                placeholderTextColor={placeholderColor}
                secureTextEntry={!showPassword}
                autoComplete="password"
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={10}>
                <FontAwesome
                  name={showPassword ? 'eye-slash' : 'eye'}
                  size={16}
                  color={placeholderColor}
                />
              </TouchableOpacity>
            </RNView>

            {/* Forgot password */}
            <TouchableOpacity
              style={styles.forgotRow}
              activeOpacity={0.7}
              onPress={() => router.push('/forgot-password')}
            >
              <Text style={[styles.forgotText, { color: Colors.primary }]}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Error */}
            {!!error && (
              <RNView style={styles.errorBox}>
                <FontAwesome name="exclamation-circle" size={13} color="#C62828" style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{error}</Text>
              </RNView>
            )}

            {/* Login */}
            <TouchableOpacity
              style={[styles.loginBtn, submitting && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.loginBtnText}>Login</Text>
              }
            </TouchableOpacity>

            {/* Divider */}
            <RNView style={styles.divider}>
              <RNView style={[styles.dividerLine, { backgroundColor: dividerColor }]} />
              <Text style={styles.dividerText}>OR</Text>
              <RNView style={[styles.dividerLine, { backgroundColor: dividerColor }]} />
            </RNView>

            {/* Google */}
            <TouchableOpacity
              style={[styles.googleBtn, { backgroundColor: isDark ? '#1E1E1E' : '#fff', borderColor: dividerColor }]}
              activeOpacity={0.85}
            >
              <Text style={styles.googleG}>G</Text>
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Register */}
            <RNView style={styles.registerRow}>
              <Text style={styles.registerText}>New here? </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push({ pathname: '/register', params: { type: loginType } })}
              >
                <Text style={[styles.registerLink, { color: Colors.primary }]}>Register Now</Text>
              </TouchableOpacity>
            </RNView>

          </RNView>

          {/* ── Guest ── */}
          <TouchableOpacity
            style={[styles.guestBtn, { borderColor: dividerColor }]}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.7}
          >
            <FontAwesome name="compass" size={15} color={Colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.guestText}>Continue as Guest</Text>
            <Text style={[styles.guestSub, { color: Colors.primary }]}> · Explore Services</Text>
          </TouchableOpacity>

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },

  // Logo
  logoSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoImage: {
    width: 260,
    height: 90,
    marginBottom: 8,
  },
  brandSub: {
    fontSize: 13,
    opacity: 0.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Login type
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.55,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  typeRow: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 11,
    alignItems: 'center',
  },
  typeTabActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  typeTabText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
    opacity: 0.55,
  },
  typeTabTextActive: {
    color: '#fff',
    opacity: 1,
  },

  // Partner chips
  partnerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  partnerChip: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  partnerChipText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Form
  form: {
    gap: 12,
    marginBottom: 24,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
    width: 18,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDEDED',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#C62828',
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: -4,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
  },
  loginBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.4,
    marginHorizontal: 12,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    height: 52,
    gap: 10,
  },
  googleG: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4285F4',
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  registerText: {
    fontSize: 14,
    opacity: 0.6,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Guest
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 16,
  },
  guestText: {
    fontSize: 14,
    fontWeight: '600',
  },
  guestSub: {
    fontSize: 14,
    fontWeight: '600',
  },
});
