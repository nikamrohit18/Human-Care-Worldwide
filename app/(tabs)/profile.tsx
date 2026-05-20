import { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View as RNView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

// ─── Types ────────────────────────────────────────────────────────────────────

type AccountType = 'individual' | 'partners' | 'corporate';

const ACCOUNT_TYPE_META: Record<AccountType, { label: string; color: string }> = {
  individual: { label: 'Individual Patient', color: '#1565C0' },
  partners:   { label: 'Partner',            color: '#7B1FA2' },
  corporate:  { label: 'Corporate Employee', color: '#00695C' },
};

// ─── Mock user (replace with real auth state) ─────────────────────────────────

const MOCK_USER = {
  name: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  phone: '+1 (555) 012-3456',
  accountType: 'individual' as AccountType,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function Toggle({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.toggle, value && { backgroundColor: Colors.primary }]}
      onPress={onToggle}
      activeOpacity={0.85}
    >
      <RNView style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
    </TouchableOpacity>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  right,
  danger = false,
  iconBg,
}: {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  label: string;
  onPress?: () => void;
  right?: React.ReactNode;
  danger?: boolean;
  iconBg?: string;
}) {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  return (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: isDark ? '#2A2A2A' : '#F0F0F0' }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.65 : 1}
    >
      <RNView
        style={[
          styles.menuIconWrap,
          {
            backgroundColor: danger
              ? Colors.primary
              : (iconBg ?? (isDark ? '#2A2A2A' : '#F0F0F0')),
          },
        ]}
      >
        <FontAwesome
          name={icon}
          size={14}
          color={danger ? '#fff' : (isDark ? '#ccc' : '#555')}
        />
      </RNView>
      <Text style={[styles.menuLabel, danger && { color: Colors.primary }]}>{label}</Text>
      <RNView style={styles.menuRight}>
        {right ?? (
          onPress
            ? <FontAwesome name="chevron-right" size={12} color={isDark ? '#444' : '#CCC'} />
            : null
        )}
      </RNView>
    </TouchableOpacity>
  );
}

function MenuCard({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  return (
    <RNView style={[styles.menuCard, { backgroundColor: isDark ? '#1A1A1A' : '#fff' }]}>
      {children}
    </RNView>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  // Replace with real auth state (Context / Zustand / MMKV)
  const [isGuest, setIsGuest] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  const { name, email, phone, accountType } = MOCK_USER;
  const typeMeta = ACCOUNT_TYPE_META[accountType];
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => router.replace('/welcome'),
      },
    ]);
  };

  // ── Guest state ─────────────────────────────────────────────────────────────
  if (isGuest) {
    return (
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Guest hero */}
          <RNView style={styles.guestHero}>
            <RNView style={[styles.guestAvatar, { backgroundColor: isDark ? '#2A2A2A' : '#EFEFEF' }]}>
              <FontAwesome name="user" size={40} color={isDark ? '#555' : '#CCC'} />
            </RNView>
            <Text style={styles.guestName}>Browsing as Guest</Text>
            <Text style={styles.guestSub}>Sign in to access your account,{'\n'}request services, and view your history.</Text>
          </RNView>

          <RNView style={styles.guestActions}>
            <TouchableOpacity
              style={styles.signInBtn}
              onPress={() => router.replace('/welcome')}
              activeOpacity={0.85}
            >
              <Text style={styles.signInBtnText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.registerBtn, { borderColor: isDark ? '#2E2E2E' : '#E5E5E5' }]}
              onPress={() => router.push('/register')}
              activeOpacity={0.85}
            >
              <Text style={[styles.registerBtnText, { color: Colors.primary }]}>Create Account</Text>
            </TouchableOpacity>
          </RNView>

          <SectionHeader title="Support" />
          <MenuCard>
            <MenuItem icon="headphones"     label="Contact Us"          onPress={() => {}} />
            <MenuItem icon="question-circle" label="FAQ & Help Centre"   onPress={() => {}} />
            <MenuItem icon="file-text-o"    label="Terms & Conditions"  onPress={() => {}} />
            <MenuItem icon="shield"         label="Privacy Policy"      onPress={() => {}} />
          </MenuCard>

          <Text style={styles.versionText}>Human Care Worldwide · v1.0.0</Text>
        </ScrollView>
      </View>
    );
  }

  // ── Logged-in state ──────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Profile card ── */}
        <RNView style={[styles.profileCard, { backgroundColor: isDark ? '#1A1A1A' : '#fff' }]}>
          <RNView style={styles.avatarWrap}>
            <RNView style={styles.avatar}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </RNView>
            <TouchableOpacity style={styles.avatarEditBtn} activeOpacity={0.8}>
              <FontAwesome name="camera" size={12} color="#fff" />
            </TouchableOpacity>
          </RNView>

          <Text style={styles.profileName}>{name}</Text>
          <Text style={styles.profileEmail}>{email}</Text>
          <Text style={styles.profilePhone}>{phone}</Text>

          <RNView style={[styles.typeBadge, { backgroundColor: typeMeta.color + '18' }]}>
            <RNView style={[styles.typeDot, { backgroundColor: typeMeta.color }]} />
            <Text style={[styles.typeBadgeText, { color: typeMeta.color }]}>{typeMeta.label}</Text>
          </RNView>

          <TouchableOpacity style={styles.editProfileBtn} activeOpacity={0.8}>
            <FontAwesome name="pencil" size={13} color={Colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.editProfileText, { color: Colors.primary }]}>Edit Profile</Text>
          </TouchableOpacity>
        </RNView>

        {/* ── My Account ── */}
        <SectionHeader title="My Account" />
        <MenuCard>
          <MenuItem icon="history"      label="Service Requests"   onPress={() => {}} />
          <MenuItem icon="heartbeat"    label="Emergency Contacts"  onPress={() => {}} />
          <MenuItem icon="shield"       label="Insurance Details"   onPress={() => {}} />
          <MenuItem icon="map-marker"   label="Saved Addresses"     onPress={() => {}} />
        </MenuCard>

        {/* ── Security ── */}
        <SectionHeader title="Security" />
        <MenuCard>
          <MenuItem icon="key"    label="Change Password"         onPress={() => router.push('/forgot-password')} />
          <MenuItem
            icon="mobile"
            label="Two-Factor Authentication"
            right={<Toggle value={twoFAEnabled} onToggle={() => setTwoFAEnabled((v) => !v)} />}
          />
        </MenuCard>

        {/* ── Preferences ── */}
        <SectionHeader title="Preferences" />
        <MenuCard>
          <MenuItem
            icon="bell"
            label="Push Notifications"
            right={<Toggle value={notificationsEnabled} onToggle={() => setNotificationsEnabled((v) => !v)} />}
          />
          <MenuItem
            icon="globe"
            label="Language"
            right={<Text style={styles.menuRightLabel}>English ›</Text>}
          />
        </MenuCard>

        {/* ── Support ── */}
        <SectionHeader title="Support" />
        <MenuCard>
          <MenuItem icon="headphones"      label="Contact Us"         onPress={() => {}} />
          <MenuItem icon="question-circle" label="FAQ & Help Centre"  onPress={() => {}} />
          <MenuItem icon="file-text-o"     label="Terms & Conditions" onPress={() => {}} />
          <MenuItem icon="shield"          label="Privacy Policy"     onPress={() => {}} />
        </MenuCard>

        {/* ── Log Out ── */}
        <SectionHeader title="" />
        <MenuCard>
          <MenuItem
            icon="sign-out"
            label="Log Out"
            onPress={handleLogout}
            danger
          />
        </MenuCard>

        <Text style={styles.versionText}>Human Care Worldwide · v1.0.0</Text>

      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Section header
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    opacity: 0.45,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },

  // Menu card
  menuCard: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // Menu item
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  menuRight: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuRightLabel: {
    fontSize: 14,
    opacity: 0.45,
    fontWeight: '500',
  },

  // Toggle
  toggle: {
    width: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#CCC',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    alignSelf: 'flex-start',
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },

  // Profile card
  profileCard: {
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 14,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarInitials: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  avatarEditBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  profileEmail: {
    fontSize: 13,
    opacity: 0.55,
    marginBottom: 2,
    textAlign: 'center',
  },
  profilePhone: {
    fontSize: 13,
    opacity: 0.45,
    marginBottom: 14,
    textAlign: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 16,
    gap: 6,
  },
  typeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  editProfileText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Guest state
  guestHero: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  guestAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  guestName: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  guestSub: {
    fontSize: 14,
    opacity: 0.55,
    textAlign: 'center',
    lineHeight: 22,
  },
  guestActions: {
    gap: 10,
    marginBottom: 8,
  },
  signInBtn: {
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
  signInBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  registerBtn: {
    borderWidth: 1.5,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Version
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.3,
    marginTop: 24,
    marginBottom: 8,
  },
});
