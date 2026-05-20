import { useState } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

type AccountType = 'individual' | 'partners' | 'corporate';
type PartnerType = 'insurance' | 'hospital' | 'corporate-hr';
type Gender = 'male' | 'female' | 'other';

const ACCOUNT_TYPES: { id: AccountType; label: string }[] = [
  { id: 'individual', label: 'Individual\n/ Patient' },
  { id: 'partners', label: 'Partners' },
  { id: 'corporate', label: 'Corporate\nEmployee' },
];

const PARTNER_TYPES: { id: PartnerType; label: string }[] = [
  { id: 'insurance', label: 'Insurance Company' },
  { id: 'hospital', label: 'Hospital' },
  { id: 'corporate-hr', label: 'Corporate HR' },
];

const GENDERS: { id: Gender; label: string }[] = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'other', label: 'Other' },
];

export default function RegisterScreen() {
  const router = useRouter();
  const { type: typeParam } = useLocalSearchParams<{ type: AccountType }>();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  const [accountType, setAccountType] = useState<AccountType>(typeParam ?? 'individual');
  const [partnerType, setPartnerType] = useState<PartnerType>('insurance');
  const [gender, setGender] = useState<Gender | ''>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    dob: '',
    orgName: '',
    contactName: '',
    regNumber: '',
    companyName: '',
    employeeId: '',
    password: '',
    confirmPassword: '',
  });

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const inputBg = isDark ? '#1E1E1E' : '#F5F5F5';
  const inputBorder = isDark ? '#2E2E2E' : '#E5E5E5';
  const inputColor = isDark ? '#F5F5F5' : '#1A1A1A';
  const placeholderColor = isDark ? '#555' : '#AAA';
  const dividerColor = isDark ? '#2E2E2E' : '#E5E5E5';
  const mutedBg = isDark ? '#1A1A1A' : '#EFEFEF';

  const Field = ({
    icon,
    placeholder,
    value,
    onChangeText,
    keyboardType = 'default',
    autoCapitalize = 'words',
    autoComplete = 'off',
  }: {
    icon: React.ComponentProps<typeof FontAwesome>['name'];
    placeholder: string;
    value: string;
    onChangeText: (v: string) => void;
    keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
    autoCapitalize?: React.ComponentProps<typeof TextInput>['autoCapitalize'];
    autoComplete?: React.ComponentProps<typeof TextInput>['autoComplete'];
  }) => (
    <RNView style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: inputBorder }]}>
      <FontAwesome name={icon} size={15} color={placeholderColor} style={styles.inputIcon} />
      <TextInput
        style={[styles.input, { color: inputColor }]}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
      />
    </RNView>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Page header ── */}
          <RNView style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Create Account</Text>
            <Text style={styles.pageSubtitle}>Join Human Care Worldwide</Text>
          </RNView>

          {/* ── Account type ── */}
          <RNView style={styles.section}>
            <Text style={styles.sectionLabel}>Register as</Text>
            <RNView style={[styles.typeRow, { backgroundColor: mutedBg }]}>
              {ACCOUNT_TYPES.map((t) => {
                const active = accountType === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.typeTab, active && styles.typeTabActive]}
                    onPress={() => setAccountType(t.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[styles.typeTabText, active && styles.typeTabTextActive]}
                      numberOfLines={2}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </RNView>
          </RNView>

          {/* ── Individual fields ── */}
          {accountType === 'individual' && (
            <RNView style={styles.fieldGroup}>
              <Text style={styles.groupLabel}>Personal Information</Text>
              <Field icon="user-o" placeholder="Full name" value={form.fullName} onChangeText={set('fullName')} />
              <Field icon="envelope-o" placeholder="Email address" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
              <Field icon="phone" placeholder="Phone number" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" autoCapitalize="none" autoComplete="tel" />
              <Field icon="calendar-o" placeholder="Date of birth (DD/MM/YYYY)" value={form.dob} onChangeText={set('dob')} keyboardType="numeric" autoCapitalize="none" />

              <Text style={[styles.inlineLabel, { marginTop: 4 }]}>Gender</Text>
              <RNView style={styles.pillRow}>
                {GENDERS.map((g) => {
                  const active = gender === g.id;
                  return (
                    <TouchableOpacity
                      key={g.id}
                      style={[
                        styles.pill,
                        { borderColor: active ? Colors.primary : dividerColor },
                        active && { backgroundColor: Colors.primary },
                      ]}
                      onPress={() => setGender(g.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.pillText, active && { color: '#fff' }]}>{g.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </RNView>
            </RNView>
          )}

          {/* ── Partner fields ── */}
          {accountType === 'partners' && (
            <RNView style={styles.fieldGroup}>
              <Text style={styles.groupLabel}>Organisation Details</Text>
              <Field icon="user-o" placeholder="Contact person name" value={form.contactName} onChangeText={set('contactName')} />
              <Field icon="envelope-o" placeholder="Email address" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
              <Field icon="phone" placeholder="Phone number" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" autoCapitalize="none" autoComplete="tel" />
              <Field icon="building-o" placeholder="Organisation name" value={form.orgName} onChangeText={set('orgName')} />

              <Text style={[styles.inlineLabel, { marginTop: 4 }]}>Partner type</Text>
              <RNView style={styles.pillRow}>
                {PARTNER_TYPES.map((pt) => {
                  const active = partnerType === pt.id;
                  return (
                    <TouchableOpacity
                      key={pt.id}
                      style={[
                        styles.pill,
                        { borderColor: active ? Colors.primary : dividerColor },
                        active && { backgroundColor: Colors.primary },
                      ]}
                      onPress={() => setPartnerType(pt.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.pillText, active && { color: '#fff' }]}>{pt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </RNView>

              <Field icon="id-card-o" placeholder="Registration / licence number" value={form.regNumber} onChangeText={set('regNumber')} autoCapitalize="characters" />
            </RNView>
          )}

          {/* ── Corporate Employee fields ── */}
          {accountType === 'corporate' && (
            <RNView style={styles.fieldGroup}>
              <Text style={styles.groupLabel}>Employee Details</Text>
              <Field icon="user-o" placeholder="Full name" value={form.fullName} onChangeText={set('fullName')} />
              <Field icon="envelope-o" placeholder="Work email address" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
              <Field icon="phone" placeholder="Phone number" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" autoCapitalize="none" autoComplete="tel" />
              <Field icon="building-o" placeholder="Company name" value={form.companyName} onChangeText={set('companyName')} />
              <Field icon="id-badge" placeholder="Employee ID" value={form.employeeId} onChangeText={set('employeeId')} autoCapitalize="characters" />
            </RNView>
          )}

          {/* ── Account Security ── */}
          <RNView style={styles.fieldGroup}>
            <Text style={styles.groupLabel}>Account Security</Text>

            <RNView style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: inputBorder }]}>
              <FontAwesome name="lock" size={17} color={placeholderColor} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: inputColor }]}
                placeholder="Password"
                placeholderTextColor={placeholderColor}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                autoCapitalize="none"
                value={form.password}
                onChangeText={set('password')}
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={10}>
                <FontAwesome name={showPassword ? 'eye-slash' : 'eye'} size={16} color={placeholderColor} />
              </TouchableOpacity>
            </RNView>

            <RNView style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: inputBorder }]}>
              <FontAwesome name="lock" size={17} color={placeholderColor} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: inputColor }]}
                placeholder="Confirm password"
                placeholderTextColor={placeholderColor}
                secureTextEntry={!showConfirm}
                autoComplete="new-password"
                autoCapitalize="none"
                value={form.confirmPassword}
                onChangeText={set('confirmPassword')}
              />
              <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} hitSlop={10}>
                <FontAwesome name={showConfirm ? 'eye-slash' : 'eye'} size={16} color={placeholderColor} />
              </TouchableOpacity>
            </RNView>
          </RNView>

          {/* ── Terms ── */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setTermsAccepted((v) => !v)}
            activeOpacity={0.8}
          >
            <RNView
              style={[
                styles.checkbox,
                { borderColor: termsAccepted ? Colors.primary : dividerColor },
                termsAccepted && { backgroundColor: Colors.primary },
              ]}
            >
              {termsAccepted && <FontAwesome name="check" size={11} color="#fff" />}
            </RNView>
            <Text style={styles.termsText}>
              {'I agree to the '}
              <Text style={[styles.termsLink, { color: Colors.primary }]}>Terms & Conditions</Text>
              {' and '}
              <Text style={[styles.termsLink, { color: Colors.primary }]}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>

          {/* ── Register button ── */}
          <TouchableOpacity
            style={[styles.registerBtn, !termsAccepted && styles.registerBtnDisabled]}
            activeOpacity={0.85}
            disabled={!termsAccepted}
          >
            <Text style={styles.registerBtnText}>Create Account</Text>
          </TouchableOpacity>

          {/* ── Divider ── */}
          <RNView style={styles.divider}>
            <RNView style={[styles.dividerLine, { backgroundColor: dividerColor }]} />
            <Text style={styles.dividerText}>OR</Text>
            <RNView style={[styles.dividerLine, { backgroundColor: dividerColor }]} />
          </RNView>

          {/* ── Google ── */}
          <TouchableOpacity
            style={[styles.googleBtn, { backgroundColor: isDark ? '#1E1E1E' : '#fff', borderColor: dividerColor }]}
            activeOpacity={0.85}
          >
            <Text style={styles.googleG}>G</Text>
            <Text style={styles.googleBtnText}>Sign up with Google</Text>
          </TouchableOpacity>

          {/* ── Login link ── */}
          <RNView style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
              <Text style={[styles.loginLink, { color: Colors.primary }]}>Login</Text>
            </TouchableOpacity>
          </RNView>

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },

  // Header
  pageHeader: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    opacity: 0.5,
  },

  // Account type selector
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

  // Field groups
  fieldGroup: {
    gap: 12,
    marginBottom: 20,
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.45,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 2,
  },
  inlineLabel: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.55,
  },

  // Input
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

  // Pills (gender / partner type)
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Terms
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.7,
  },
  termsLink: {
    fontWeight: '600',
    opacity: 1,
  },

  // Register button
  registerBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  registerBtnDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
  registerBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
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

  // Google
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    height: 52,
    gap: 10,
    marginBottom: 20,
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

  // Login link
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    opacity: 0.6,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
