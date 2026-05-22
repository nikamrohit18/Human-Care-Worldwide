import { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View as RNView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import {
  subscribeToDoctorConsultations,
  acceptConsultation,
  rejectConsultation,
  cancelConsultation,
  isCancellable,
  sendPushNotificationToUser,
  storeNotificationId,
  FirestoreConsultation,
  ConsultationType,
  ConsultationStatus,
} from '@/lib/firestoreConsultations';
import { scheduleReminderForDoctor } from '@/lib/notifications';
import { useLanguage } from '@/context/LanguageContext';

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
  pending:   '#F59E0B',
  accepted:  '#10B981',
  completed: '#6B7280',
  cancelled: '#EF4444',
  rejected:  '#EF4444',
};

const STATUS_LABEL: Record<ConsultationStatus, string> = {
  pending:   'Pending',
  accepted:  'Accepted',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected:  'Rejected',
};

export default function TeleConsultationDoctorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const { user, profile } = useAuth();

  const { t } = useLanguage();
  const [pendingList, setPendingList] = useState<FirestoreConsultation[]>([]);
  const [mineList, setMineList] = useState<FirestoreConsultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToDoctorConsultations(user.uid, (pending, mine) => {
      setPendingList(pending);
      setMineList(mine);
      setLoading(false);
    });
    return unsub;
  }, [user?.uid]);

  const handleAccept = useCallback(async (c: FirestoreConsultation) => {
    if (!user || !profile) return;

    const doctorName = profile.fullName ?? user.email ?? 'Doctor';

    const doAccept = async () => {
      setAccepting(c.id);
      try {
        // Atomic acceptance — throws if another doctor already accepted
        await acceptConsultation(c.id, user.uid, doctorName);

        // Schedule doctor's own 5-min local reminder
        const notifId = await scheduleReminderForDoctor({
          id: c.id,
          userId: user.uid,
          date: c.date,
          time: c.time,
          type: c.type,
          duration: c.duration,
          charge: c.charge,
          status: 'accepted',
          createdAt: c.createdAt,
        });
        if (notifId) {
          await storeNotificationId(c.id, 'doctorNotificationId', notifId);
        }

        // Push notification to patient (cross-device via Expo push service)
        await sendPushNotificationToUser(
          c.patientId,
          '✅ Appointment Confirmed!',
          `Dr. ${doctorName} has accepted your ${TYPE_LABELS[c.type]} on ${formatDate(c.date)} at ${formatTime(c.time)}.`,
          { consultationId: c.id, screen: 'appointments' },
        );
      } catch (e: any) {
        const msg = e?.message === 'Already accepted by another doctor'
          ? 'This appointment was just accepted by another doctor.'
          : e?.message?.includes('Slot conflict')
            ? t.slotConflict
            : 'Failed to accept appointment. Please try again.';
        if (Platform.OS === 'web') {
          window.alert(msg);
        } else {
          Alert.alert(t.error, msg);
        }
      } finally {
        setAccepting(null);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Accept consultation with ${c.patientName} on ${formatDate(c.date)} at ${formatTime(c.time)}?`)) {
        await doAccept();
      }
    } else {
      Alert.alert(
        'Accept Consultation?',
        `Accept ${TYPE_LABELS[c.type]} with ${c.patientName} on ${formatDate(c.date)} at ${formatTime(c.time)}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Accept', onPress: doAccept },
        ],
      );
    }
  }, [user, profile]);

  const handleReject = useCallback(async (c: FirestoreConsultation) => {
    const doReject = async () => {
      setRejecting(c.id);
      try {
        await rejectConsultation(c.id);
        await sendPushNotificationToUser(
          c.patientId,
          '❌ Appointment Declined',
          `Your ${TYPE_LABELS[c.type]} request for ${formatDate(c.date)} at ${formatTime(c.time)} could not be accommodated. Please book a new slot.`,
          { consultationId: c.id, screen: 'appointments' },
        );
      } catch (e: any) {
        const msg = 'Failed to decline appointment. Please try again.';
        if (Platform.OS === 'web') { window.alert(msg); } else { Alert.alert(t.error, msg); }
      } finally {
        setRejecting(null);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Decline consultation with ${c.patientName} on ${formatDate(c.date)} at ${formatTime(c.time)}?`)) {
        await doReject();
      }
    } else {
      Alert.alert(
        'Decline Consultation?',
        `Decline ${TYPE_LABELS[c.type]} with ${c.patientName} on ${formatDate(c.date)} at ${formatTime(c.time)}?`,
        [
          { text: t.cancel, style: 'cancel' },
          { text: t.decline, style: 'destructive', onPress: doReject },
        ],
      );
    }
  }, [t]);

  const handleCancel = useCallback(async (c: FirestoreConsultation) => {
    if (!user || !profile) return;
    if (!isCancellable(c)) {
      if (Platform.OS === 'web') { window.alert(t.cancelWithin30Error); }
      else { Alert.alert(t.error, t.cancelWithin30Error); }
      return;
    }

    const doctorName = profile.fullName ?? user.email ?? 'Doctor';

    const doCancel = async () => {
      setCancelling(c.id);
      try {
        await cancelConsultation(c.id, 'doctor');
        await sendPushNotificationToUser(
          c.patientId,
          '❌ Appointment Cancelled',
          `Dr. ${doctorName} has cancelled your ${TYPE_LABELS[c.type]} on ${formatDate(c.date)} at ${formatTime(c.time)}.`,
          { consultationId: c.id, screen: 'appointments' },
        );
      } catch (e: any) {
        const msg = e?.message?.includes('30 minutes')
          ? t.cancelWithin30Error
          : 'Failed to cancel appointment. Please try again.';
        if (Platform.OS === 'web') { window.alert(msg); } else { Alert.alert(t.error, msg); }
      } finally {
        setCancelling(null);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(t.cancelAppointmentMsg)) await doCancel();
    } else {
      Alert.alert(t.cancelAppointmentTitle, t.cancelAppointmentMsg, [
        { text: t.cancel, style: 'cancel' },
        { text: t.cancelAppointment, style: 'destructive', onPress: doCancel },
      ]);
    }
  }, [user, profile, t]);

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

  const renderPendingCard = (c: FirestoreConsultation) => (
    <RNView key={c.id} style={[styles.card, { backgroundColor: card, borderColor: border }]}>
      <RNView style={styles.cardHeader}>
        <RNView style={styles.cardLeft}>
          <Text style={styles.cardIcon}>{TYPE_ICONS[c.type]}</Text>
          <RNView>
            <Text style={[styles.cardType, { color: textColor }]}>{TYPE_LABELS[c.type]}</Text>
            <Text style={[styles.cardSub, { color: subText }]}>{c.duration} min</Text>
          </RNView>
        </RNView>
        <RNView style={[styles.badge, { backgroundColor: '#F59E0B20' }]}>
          <Text style={[styles.badgeText, { color: '#F59E0B' }]}>New Request</Text>
        </RNView>
      </RNView>

      <RNView style={[styles.patientRow, { borderColor: border }]}>
        <Text style={[styles.patientLabel, { color: subText }]}>Patient</Text>
        <Text style={[styles.patientName, { color: textColor }]}>{c.patientName}</Text>
      </RNView>

      <RNView style={[styles.divider, { borderColor: border }]} />

      <RNView style={styles.cardFooter}>
        <Text style={[styles.footerItem, { color: subText }]}>📅 {formatDate(c.date)}</Text>
        <Text style={[styles.footerItem, { color: subText }]}>🕐 {formatTime(c.time)}</Text>
        <Text style={[styles.footerItem, { color: Colors.primary, fontWeight: '700' }]}>
          ₹{c.charge}
        </Text>
      </RNView>

      <RNView style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.rejectBtn, rejecting === c.id && { opacity: 0.7 }]}
          activeOpacity={0.85}
          onPress={() => handleReject(c)}
          disabled={accepting === c.id || rejecting === c.id}
        >
          {rejecting === c.id
            ? <ActivityIndicator color={Colors.primary} size="small" />
            : <Text style={styles.rejectBtnText}>✕  Decline</Text>
          }
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.acceptBtn, accepting === c.id && { opacity: 0.7 }]}
          activeOpacity={0.85}
          onPress={() => handleAccept(c)}
          disabled={accepting === c.id || rejecting === c.id}
        >
          {accepting === c.id
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.acceptBtnText}>✓  Accept</Text>
          }
        </TouchableOpacity>
      </RNView>
    </RNView>
  );

  const renderMyCard = (c: FirestoreConsultation) => {
    const statusColor = STATUS_COLOR[c.status] ?? '#6B7280';
    const statusLabel = STATUS_LABEL[c.status] ?? c.status;
    const canJoin = c.status === 'accepted';
    const canCancel = isCancellable(c);

    return (
      <RNView key={c.id} style={[styles.card, { backgroundColor: card, borderColor: border }]}>
        <RNView style={styles.cardHeader}>
          <RNView style={styles.cardLeft}>
            <Text style={styles.cardIcon}>{TYPE_ICONS[c.type]}</Text>
            <RNView>
              <Text style={[styles.cardType, { color: textColor }]}>{TYPE_LABELS[c.type]}</Text>
              <Text style={[styles.cardSub, { color: subText }]}>{c.duration} min</Text>
            </RNView>
          </RNView>
          <RNView style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
          </RNView>
        </RNView>

        <RNView style={[styles.patientRow, { borderColor: border }]}>
          <Text style={[styles.patientLabel, { color: subText }]}>Patient</Text>
          <Text style={[styles.patientName, { color: textColor }]}>{c.patientName}</Text>
        </RNView>

        <RNView style={[styles.divider, { borderColor: border }]} />

        <RNView style={styles.cardFooter}>
          <Text style={[styles.footerItem, { color: subText }]}>📅 {formatDate(c.date)}</Text>
          <Text style={[styles.footerItem, { color: subText }]}>🕐 {formatTime(c.time)}</Text>
          <Text style={[styles.footerItem, { color: Colors.primary, fontWeight: '700' }]}>
            ₹{c.charge}
          </Text>
        </RNView>

        {canJoin && (
          <TouchableOpacity
            style={styles.joinBtn}
            activeOpacity={0.85}
            onPress={() => router.push(`/services/tele-consultation-call?id=${c.id}` as any)}
          >
            <Text style={styles.joinBtnText}>{t.joinConsultation}</Text>
          </TouchableOpacity>
        )}

        {canCancel && (
          <TouchableOpacity
            style={[styles.cancelBtn, cancelling === c.id && { opacity: 0.6 }]}
            activeOpacity={0.85}
            disabled={cancelling === c.id}
            onPress={() => handleCancel(c)}
          >
            {cancelling === c.id
              ? <ActivityIndicator color="#EF4444" size="small" />
              : <Text style={styles.cancelBtnText}>{t.cancelAppointment}</Text>
            }
          </TouchableOpacity>
        )}

        {c.status === 'cancelled' && c.cancelledBy === 'patient' && (
          <Text style={[styles.recordingHint, { color: '#EF4444' }]}>
            ❌ {t.cancelledByPatient}
          </Text>
        )}

        {c.status === 'completed' && c.dailyRoomName && (
          <Text style={[styles.recordingHint, { color: subText }]}>
            Recording ref: {c.dailyRoomName}
          </Text>
        )}
      </RNView>
    );
  };

  const myUpcoming = mineList.filter(c => c.status === 'accepted');
  const myHistory = mineList.filter(c => c.status === 'completed' || c.status === 'cancelled');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bg }}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Pending requests from patients */}
      {pendingList.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { color: subText }]}>
            PENDING REQUESTS ({pendingList.length})
          </Text>
          {pendingList.map(renderPendingCard)}
        </>
      )}

      {pendingList.length === 0 && (
        <RNView style={[styles.emptySection, { backgroundColor: card, borderColor: border }]}>
          <Text style={[styles.emptySectionText, { color: subText }]}>
            No pending consultation requests right now
          </Text>
        </RNView>
      )}

      {/* Doctor's accepted upcoming consultations */}
      {myUpcoming.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { color: subText }]}>MY UPCOMING</Text>
          {myUpcoming.map(renderMyCard)}
        </>
      )}

      {/* Doctor's history */}
      {myHistory.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { color: subText }]}>HISTORY</Text>
          {myHistory.map(renderMyCard)}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 12,
  },
  card: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: { fontSize: 28 },
  cardType: { fontSize: 15, fontWeight: '700' },
  cardSub: { fontSize: 13, marginTop: 2 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  patientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  patientLabel: { fontSize: 13 },
  patientName: { fontSize: 13, fontWeight: '600' },
  divider: { borderTopWidth: 1, marginVertical: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerItem: { fontSize: 13 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  rejectBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  rejectBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '700' },
  acceptBtn: {
    flex: 1,
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  acceptBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  joinBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  joinBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelBtnText: { color: '#EF4444', fontSize: 14, fontWeight: '700' },
  recordingHint: { fontSize: 11, marginTop: 8, textAlign: 'center', fontFamily: 'monospace' },
  emptySection: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    marginBottom: 8,
  },
  emptySectionText: { fontSize: 14, textAlign: 'center' },
});
