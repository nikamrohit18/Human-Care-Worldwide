import { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View as RNView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import {
  loadConsultations,
  Consultation,
  ConsultationType,
  ConsultationStatus,
} from '@/lib/consultationStorage';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

const TYPE_LABELS: Record<ConsultationType, string> = {
  video: 'Video Call',
  phone: 'Phone Call',
  'house-call': 'House Call',
};

const TYPE_ICONS: Record<ConsultationType, string> = {
  video: '📹',
  phone: '📞',
  'house-call': '🏠',
};

const STATUS_COLOR: Record<ConsultationStatus, string> = {
  upcoming:  '#10B981',
  completed: '#6B7280',
  cancelled: '#EF4444',
};

export default function TeleConsultationAppointmentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const list = await loadConsultations(user.uid);
    // Sort: most recent first by date+time
    list.sort((a, b) =>
      `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`)
    );
    setConsultations(list);
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  // Reload whenever this screen comes into focus (e.g., after booking)
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const upcoming = consultations.filter(c => c.status === 'upcoming');
  const past = consultations.filter(c => c.status !== 'upcoming');

  const bg = isDark ? '#121212' : '#F8F9FA';
  const card = isDark ? '#1E1E1E' : '#FFFFFF';
  const border = isDark ? '#2E2E2E' : '#E8E8E8';
  const textColor = isDark ? '#F5F5F5' : '#1A1A1A';
  const subText = isDark ? '#888' : '#666';

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const renderCard = (c: Consultation) => (
    <RNView key={c.id} style={[styles.card, { backgroundColor: card, borderColor: border }]}>
      <RNView style={styles.cardHeader}>
        <RNView style={styles.cardLeft}>
          <Text style={styles.cardIcon}>{TYPE_ICONS[c.type]}</Text>
          <RNView>
            <Text style={[styles.cardType, { color: textColor }]}>{TYPE_LABELS[c.type]}</Text>
            <Text style={[styles.cardSub, { color: subText }]}>{c.duration} min</Text>
          </RNView>
        </RNView>
        <RNView style={[styles.badge, { backgroundColor: STATUS_COLOR[c.status] + '20' }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLOR[c.status] }]}>
            {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
          </Text>
        </RNView>
      </RNView>

      <RNView style={[styles.divider, { borderColor: border }]} />

      <RNView style={styles.cardFooter}>
        <Text style={[styles.footerItem, { color: subText }]}>📅 {formatDate(c.date)}</Text>
        <Text style={[styles.footerItem, { color: subText }]}>🕐 {formatTime(c.time)}</Text>
        <Text style={[styles.footerItem, { color: Colors.primary, fontWeight: '700' }]}>
          ₹{c.charge}
        </Text>
      </RNView>

      {c.status === 'upcoming' && (
        <TouchableOpacity
          style={styles.startBtn}
          activeOpacity={0.85}
          onPress={() => {
            // Video call screen — to be built in next phase
            router.push(`/services/tele-consultation-call?id=${c.id}` as any);
          }}
        >
          <Text style={styles.startBtnText}>▶  Start Consultation</Text>
        </TouchableOpacity>
      )}
    </RNView>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bg }}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          tintColor={Colors.primary}
        />
      }
    >
      <TouchableOpacity
        style={styles.bookBtn}
        onPress={() => router.push('/services/tele-consultation-book' as any)}
        activeOpacity={0.85}
      >
        <Text style={styles.bookBtnText}>+ Book New Consultation</Text>
      </TouchableOpacity>

      {upcoming.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { color: subText }]}>UPCOMING</Text>
          {upcoming.map(renderCard)}
        </>
      )}

      {past.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { color: subText }]}>HISTORY</Text>
          {past.map(renderCard)}
        </>
      )}

      {consultations.length === 0 && (
        <RNView style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={[styles.emptyTitle, { color: textColor }]}>No consultations yet</Text>
          <Text style={[styles.emptyText, { color: subText }]}>
            Book your first consultation to get started.
          </Text>
        </RNView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  bookBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  bookBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 28,
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: { fontSize: 28 },
  cardType: { fontSize: 15, fontWeight: '700' },
  cardSub: { fontSize: 13, marginTop: 2 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  divider: { borderTopWidth: 1, marginVertical: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerItem: { fontSize: 13 },
  startBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  startBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
