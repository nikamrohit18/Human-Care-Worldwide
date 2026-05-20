import { useState, useEffect } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View as RNView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

const RESEND_COOLDOWN = 30;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputBg = isDark ? '#1E1E1E' : '#F5F5F5';
  const inputBorder = isDark ? '#2E2E2E' : '#E5E5E5';
  const inputColor = isDark ? '#F5F5F5' : '#1A1A1A';
  const placeholderColor = isDark ? '#555' : '#AAA';
  const dividerColor = isDark ? '#2E2E2E' : '#E5E5E5';

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleSend = () => {
    if (!email.trim()) return;
    setSent(true);
    setCooldown(RESEND_COOLDOWN);
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    setCooldown(RESEND_COOLDOWN);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Icon ── */}
          <RNView style={styles.iconSection}>
            <RNView style={[styles.iconRing, sent && styles.iconRingSuccess]}>
              <FontAwesome
                name={sent ? 'check' : 'lock'}
                size={sent ? 38 : 34}
                color="#fff"
              />
            </RNView>
          </RNView>

          {/* ── Copy ── */}
          {!sent ? (
            <RNView style={styles.copySection}>
              <Text style={styles.title}>Reset your password</Text>
              <Text style={styles.subtitle}>
                Enter your registered email address and we'll send you a secure link to reset your password.
              </Text>
            </RNView>
          ) : (
            <RNView style={styles.copySection}>
              <Text style={styles.title}>Check your inbox</Text>
              <Text style={styles.subtitle}>
                {'We sent a reset link to\n'}
                <Text style={[styles.emailHighlight, { color: Colors.primary }]}>{email}</Text>
                {'\n\nIf you don\'t see it within a few minutes, check your spam or junk folder.'}
              </Text>
            </RNView>
          )}

          {/* ── Form (entry state) ── */}
          {!sent && (
            <RNView style={styles.form}>
              <RNView style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                <FontAwesome name="envelope-o" size={15} color={placeholderColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: inputColor }]}
                  placeholder="Email address"
                  placeholderTextColor={placeholderColor}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChangeText={setEmail}
                  onSubmitEditing={handleSend}
                  returnKeyType="send"
                />
              </RNView>

              <TouchableOpacity
                style={[styles.primaryBtn, !email.trim() && styles.primaryBtnDisabled]}
                onPress={handleSend}
                activeOpacity={0.85}
                disabled={!email.trim()}
              >
                <Text style={styles.primaryBtnText}>Send Reset Link</Text>
              </TouchableOpacity>
            </RNView>
          )}

          {/* ── Actions (success state) ── */}
          {sent && (
            <RNView style={styles.form}>

              {/* Resend */}
              <TouchableOpacity
                style={[styles.outlineBtn, { borderColor: cooldown > 0 ? dividerColor : Colors.primary }]}
                onPress={handleResend}
                activeOpacity={0.75}
                disabled={cooldown > 0}
              >
                <FontAwesome
                  name="refresh"
                  size={14}
                  color={cooldown > 0 ? (isDark ? '#555' : '#AAA') : Colors.primary}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={[
                    styles.outlineBtnText,
                    { color: cooldown > 0 ? (isDark ? '#555' : '#AAA') : Colors.primary },
                  ]}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email'}
                </Text>
              </TouchableOpacity>

              {/* Back to Login */}
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => router.back()}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>Back to Login</Text>
              </TouchableOpacity>

              {/* Wrong email */}
              <TouchableOpacity
                style={styles.wrongEmailRow}
                onPress={() => { setSent(false); setCooldown(0); }}
                activeOpacity={0.7}
              >
                <Text style={styles.wrongEmailText}>Wrong email address? </Text>
                <Text style={[styles.wrongEmailLink, { color: Colors.primary }]}>Change it</Text>
              </TouchableOpacity>

            </RNView>
          )}

          {/* ── Divider + Back to Login (entry state only) ── */}
          {!sent && (
            <>
              <RNView style={styles.divider}>
                <RNView style={[styles.dividerLine, { backgroundColor: dividerColor }]} />
                <Text style={styles.dividerText}>OR</Text>
                <RNView style={[styles.dividerLine, { backgroundColor: dividerColor }]} />
              </RNView>

              <TouchableOpacity
                style={styles.backRow}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <FontAwesome name="arrow-left" size={13} color={Colors.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.backText, { color: Colors.primary }]}>Back to Login</Text>
              </TouchableOpacity>
            </>
          )}

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },

  // Icon
  iconSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  iconRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  iconRingSuccess: {
    backgroundColor: '#2E7D32',
    shadowColor: '#2E7D32',
  },

  // Copy
  copySection: {
    alignItems: 'center',
    marginBottom: 36,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    opacity: 0.6,
  },
  emailHighlight: {
    fontWeight: '700',
    opacity: 1,
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

  // Buttons
  primaryBtn: {
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
  primaryBtnDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    height: 52,
  },
  outlineBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Wrong email (success state)
  wrongEmailRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  wrongEmailText: {
    fontSize: 13,
    opacity: 0.55,
  },
  wrongEmailLink: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.4,
    marginHorizontal: 12,
  },

  // Back link
  backRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
