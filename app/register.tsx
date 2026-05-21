import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View as RNView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { firebaseErrorMessage } from '@/lib/firebaseErrors';

type AccountType = 'individual' | 'partners' | 'corporate';
type PartnerType = 'insurance' | 'hospital' | 'corporate-hr' | 'doctor';
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
  { id: 'doctor', label: 'Doctor' },
];

const GENDERS: { id: Gender; label: string }[] = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'other', label: 'Other' },
];

// ─── Field must live OUTSIDE RegisterScreen so React doesn't recreate it on
//     every render. Defining a component inside another component causes React
//     to treat it as a new type each render → full unmount/remount → focus loss.
function Field({
  icon,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  autoCapitalize = 'words',
  autoComplete = 'off',
  isDark,
}: {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
  autoCapitalize?: React.ComponentProps<typeof TextInput>['autoCapitalize'];
  autoComplete?: React.ComponentProps<typeof TextInput>['autoComplete'];
  isDark: boolean;
}) {
  const inputBg = isDark ? '#1E1E1E' : '#F5F5F5';
  const inputBorder = isDark ? '#2E2E2E' : '#E5E5E5';
  const inputColor = isDark ? '#F5F5F5' : '#1A1A1A';
  const placeholderColor = isDark ? '#555' : '#AAA';

  return (
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
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function parseDMY(str: string): Date {
  const [d, m, y] = str.split('/').map(Number);
  const date = new Date(y, m - 1, d);
  return isNaN(date.getTime()) ? new Date(1990, 0, 1) : date;
}

function formatDMY(date: Date): string {
  return [
    date.getDate().toString().padStart(2, '0'),
    (date.getMonth() + 1).toString().padStart(2, '0'),
    date.getFullYear(),
  ].join('/');
}

function dmyToISO(dmy: string): string {
  if (!dmy || dmy.split('/').length !== 3) return '';
  const [d, m, y] = dmy.split('/');
  return `${y}-${m}-${d}`;
}

function isoToDMY(iso: string): string {
  if (!iso || iso.split('-').length !== 3) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const TODAY_ISO = new Date().toISOString().split('T')[0];
const MIN_ISO = '1900-01-01';

// ─── Cross-platform date picker field ─────────────────────────────────────────
// Web  → browser-native <input type="date">
// iOS/Android → @react-native-community/datetimepicker in a modal

function DateField({
  value,
  onChange,
  isDark,
}: {
  value: string;
  onChange: (v: string) => void;
  isDark: boolean;
}) {
  const [showPicker, setShowPicker] = useState(false);

  const inputBg = isDark ? '#1E1E1E' : '#F5F5F5';
  const inputBorder = isDark ? '#2E2E2E' : '#E5E5E5';
  const inputColor = isDark ? '#F5F5F5' : '#1A1A1A';
  const placeholderColor = isDark ? '#555' : '#AAA';

  // ── Web ──────────────────────────────────────────────────────────────────────
  if (Platform.OS === 'web') {
    return (
      <RNView style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: inputBorder }]}>
        <FontAwesome name="calendar-o" size={15} color={placeholderColor} style={styles.inputIcon} />
        <RNView style={{ flex: 1, height: '100%', justifyContent: 'center' }}>
          {/*
           * @ts-ignore — raw <input> is valid in React Native Web.
           * We use a browser-native date picker here to avoid extra dependencies.
           */}
          <input
            type="date"
            value={dmyToISO(value)}
            min={MIN_ISO}
            max={TODAY_ISO}
            onChange={(e: any) => {
              if (e.target.value) onChange(isoToDMY(e.target.value));
            }}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 15,
              color: value ? inputColor : placeholderColor,
              width: '100%',
              cursor: 'pointer',
              fontFamily: 'inherit',
              padding: 0,
            }}
          />
        </RNView>
      </RNView>
    );
  }

  // ── Native (iOS / Android) ────────────────────────────────────────────────────
  const pickerDate = value ? parseDMY(value) : new Date(1990, 0, 1);

  // Lazy-require so the web bundle never tries to resolve the native module.
  let DateTimePicker: any = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    DateTimePicker = require('@react-native-community/datetimepicker').default;
  } catch {
    // Native module not available — fall back to plain text input
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: inputBorder }]}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.7}
      >
        <FontAwesome name="calendar-o" size={15} color={placeholderColor} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: value ? inputColor : placeholderColor }]}
          placeholder="Date of birth (DD/MM/YYYY)"
          placeholderTextColor={placeholderColor}
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          autoCapitalize="none"
          editable={!DateTimePicker}
        />
        {!!DateTimePicker && (
          <FontAwesome name="chevron-down" size={12} color={placeholderColor} />
        )}
      </TouchableOpacity>

      {showPicker && !!DateTimePicker && (
        <Modal transparent animationType="fade" onRequestClose={() => setShowPicker(false)}>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}
            activeOpacity={1}
            onPress={() => setShowPicker(false)}
          >
            <RNView style={{ backgroundColor: isDark ? '#1A1A1A' : '#fff', paddingBottom: 24 }}>
              <DateTimePicker
                value={pickerDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
                onChange={(_: any, selected?: Date) => {
                  if (Platform.OS !== 'ios') setShowPicker(false);
                  if (selected) onChange(formatDMY(selected));
                }}
              />
            </RNView>
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function RegisterScreen() {
  const router = useRouter();
  const { type: typeParam } = useLocalSearchParams<{ type: AccountType }>();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const { signUp } = useAuth();

  const [accountType, setAccountType] = useState<AccountType>(typeParam ?? 'individual');
  const [partnerType, setPartnerType] = useState<PartnerType>('insurance');
  const [gender, setGender] = useState<Gender | ''>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    dob: '',
    orgName: '',
    contactName: '',
    regNumber: '',
    specialization: '',
    companyName: '',
    employeeId: '',
    password: '',
    confirmPassword: '',
  });

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  // Derived colours (only used by password fields inline)
  const inputBg = isDark ? '#1E1E1E' : '#F5F5F5';
  const inputBorder = isDark ? '#2E2E2E' : '#E5E5E5';
  const inputColor = isDark ? '#F5F5F5' : '#1A1A1A';
  const placeholderColor = isDark ? '#555' : '#AAA';
  const dividerColor = isDark ? '#2E2E2E' : '#E5E5E5';
  const mutedBg = isDark ? '#1A1A1A' : '#EFEFEF';

  const handleRegister = async () => {
    if (!termsAccepted) return;
    setError('');

    if (accountType === 'individual') {
      if (!form.fullName.trim()) { setError('Full name is required.'); return; }
    } else if (accountType === 'partners') {
      if (partnerType === 'doctor') {
        if (!form.contactName.trim()) { setError('Full name is required.'); return; }
        if (!form.specialization.trim()) { setError('Specialization is required.'); return; }
      } else {
        if (!form.contactName.trim()) { setError('Contact person name is required.'); return; }
        if (!form.orgName.trim()) { setError('Organisation name is required.'); return; }
      }
    } else {
      if (!form.fullName.trim()) { setError('Full name is required.'); return; }
      if (!form.companyName.trim()) { setError('Company name is required.'); return; }
    }
    if (!form.email.trim()) { setError('Email address is required.'); return; }
    if (!form.phone.trim()) { setError('Phone number is required.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }

    setSubmitting(true);
    try {
      let profileData: Parameters<typeof signUp>[2];

      if (accountType === 'individual') {
        profileData = {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          accountType,
          gender: (gender || undefined) as any,
          dob: form.dob || undefined,
        };
      } else if (accountType === 'partners') {
        if (partnerType === 'doctor') {
          profileData = {
            fullName: form.contactName.trim(),
            contactName: form.contactName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            accountType,
            partnerType,
            specialization: form.specialization.trim(),
            orgName: form.orgName.trim() || undefined,
            regNumber: form.regNumber.trim() || undefined,
          };
        } else {
          profileData = {
            fullName: form.contactName.trim(),
            contactName: form.contactName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            accountType,
            orgName: form.orgName.trim(),
            regNumber: form.regNumber.trim() || undefined,
            partnerType,
          };
        }
      } else {
        profileData = {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          accountType,
          companyName: form.companyName.trim(),
          employeeId: form.employeeId.trim() || undefined,
        };
      }

      await signUp(form.email.trim(), form.password, profileData);
      router.replace('/(tabs)');
    } catch (e: any) {
      console.error('Registration error — code:', e.code, '| message:', e.message);
      setError(firebaseErrorMessage(e.code ?? ''));
    } finally {
      setSubmitting(false);
    }
  };

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
              <Field isDark={isDark} icon="user-o" placeholder="Full name" value={form.fullName} onChangeText={set('fullName')} />
              <Field isDark={isDark} icon="envelope-o" placeholder="Email address" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
              <Field isDark={isDark} icon="phone" placeholder="Phone number" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" autoCapitalize="none" autoComplete="tel" />
              <DateField isDark={isDark} value={form.dob} onChange={set('dob')} />

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
              <Text style={styles.groupLabel}>
                {partnerType === 'doctor' ? 'Doctor Details' : 'Organisation Details'}
              </Text>

              <Field
                isDark={isDark}
                icon="user-o"
                placeholder={partnerType === 'doctor' ? 'Full name (Dr.)' : 'Contact person name'}
                value={form.contactName}
                onChangeText={set('contactName')}
              />
              <Field isDark={isDark} icon="envelope-o" placeholder="Email address" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
              <Field isDark={isDark} icon="phone" placeholder="Phone number" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" autoCapitalize="none" autoComplete="tel" />

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

              {/* Doctor-specific fields */}
              {partnerType === 'doctor' && (
                <>
                  <Field
                    isDark={isDark}
                    icon="stethoscope"
                    placeholder="Specialization (e.g. Cardiologist)"
                    value={form.specialization}
                    onChangeText={set('specialization')}
                  />
                  <Field
                    isDark={isDark}
                    icon="building-o"
                    placeholder="Hospital / Clinic affiliation (optional)"
                    value={form.orgName}
                    onChangeText={set('orgName')}
                  />
                  <Field
                    isDark={isDark}
                    icon="id-card-o"
                    placeholder="Medical registration number"
                    value={form.regNumber}
                    onChangeText={set('regNumber')}
                    autoCapitalize="characters"
                  />
                </>
              )}

              {/* Non-doctor partner fields */}
              {partnerType !== 'doctor' && (
                <>
                  <Field isDark={isDark} icon="building-o" placeholder="Organisation name" value={form.orgName} onChangeText={set('orgName')} />
                  <Field isDark={isDark} icon="id-card-o" placeholder="Registration / licence number" value={form.regNumber} onChangeText={set('regNumber')} autoCapitalize="characters" />
                </>
              )}
            </RNView>
          )}

          {/* ── Corporate Employee fields ── */}
          {accountType === 'corporate' && (
            <RNView style={styles.fieldGroup}>
              <Text style={styles.groupLabel}>Employee Details</Text>
              <Field isDark={isDark} icon="user-o" placeholder="Full name" value={form.fullName} onChangeText={set('fullName')} />
              <Field isDark={isDark} icon="envelope-o" placeholder="Work email address" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
              <Field isDark={isDark} icon="phone" placeholder="Phone number" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" autoCapitalize="none" autoComplete="tel" />
              <Field isDark={isDark} icon="building-o" placeholder="Company name" value={form.companyName} onChangeText={set('companyName')} />
              <Field isDark={isDark} icon="id-badge" placeholder="Employee ID" value={form.employeeId} onChangeText={set('employeeId')} autoCapitalize="characters" />
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

          {/* ── Error ── */}
          {!!error && (
            <RNView style={styles.errorBox}>
              <FontAwesome name="exclamation-circle" size={13} color="#C62828" style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{error}</Text>
            </RNView>
          )}

          {/* ── Register button ── */}
          <TouchableOpacity
            style={[styles.registerBtn, (!termsAccepted || submitting) && styles.registerBtnDisabled]}
            activeOpacity={0.85}
            disabled={!termsAccepted || submitting}
            onPress={handleRegister}
          >
            {submitting
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.registerBtnText}>Create Account</Text>
            }
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

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDEDED',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#C62828',
  },

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
