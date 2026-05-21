import { useState, useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View as RNView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import {
  bookConsultation,
  storeNotificationId,
  CHARGES,
  ConsultationType,
} from '@/lib/firestoreConsultations';
import { scheduleConsultationReminder } from '@/lib/notifications';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30',
  '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30',
];

const TYPES: { id: ConsultationType; label: string; icon: string }[] = [
  { id: 'video',      label: 'Video Call',  icon: '📹' },
  { id: 'phone',      label: 'Phone Call',  icon: '📞' },
  { id: 'house-call', label: 'House Call',  icon: '🏠' },
];

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

function toISO(d: Date) {
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}

export default function TeleConsultationBookScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const { user, profile } = useAuth();

  const dates = useMemo(() => {
    const arr: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(toISO(dates[0]));
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedType, setSelectedType] = useState<ConsultationType>('video');
  const [selectedDuration, setSelectedDuration] = useState<15 | 30>(15);
  const [submitting, setSubmitting] = useState(false);

  const charge = CHARGES[selectedType][selectedDuration];

  const handleConfirm = async () => {
    if (!selectedTime) {
      Alert.alert('Select Time', 'Please select a consultation time slot.');
      return;
    }
    if (!user) {
      Alert.alert('Not signed in', 'Please sign in to book a consultation.');
      return;
    }
    setSubmitting(true);
    try {
      const id = `${user.uid}_${Date.now()}`;
      const patientName = profile?.fullName ?? user.email ?? 'Patient';

      await bookConsultation({
        id,
        patientId: user.uid,
        patientName,
        date: selectedDate,
        time: selectedTime,
        type: selectedType,
        duration: selectedDuration,
        charge,
        createdAt: new Date().toISOString(),
      });

      // Schedule local 5-min reminder for patient; store ID in Firestore
      const notificationId = await scheduleConsultationReminder({
        id,
        userId: user.uid,
        date: selectedDate,
        time: selectedTime,
        type: selectedType,
        duration: selectedDuration,
        charge,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      if (notificationId) {
        await storeNotificationId(id, 'patientNotificationId', notificationId);
      }

      router.replace('/services/tele-consultation-appointments' as any);
    } catch {
      Alert.alert('Error', 'Failed to book consultation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const bg = isDark ? '#121212' : '#F8F9FA';
  const card = isDark ? '#1E1E1E' : '#FFFFFF';
  const border = isDark ? '#2E2E2E' : '#E8E8E8';
  const textColor = isDark ? '#F5F5F5' : '#1A1A1A';
  const subText = isDark ? '#888' : '#666';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bg }}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Date */}
      <Text style={[styles.sectionLabel, { color: subText }]}>CHOOSE DATE</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateRow}>
        {dates.map(d => {
          const iso = toISO(d);
          const isSelected = iso === selectedDate;
          return (
            <TouchableOpacity
              key={iso}
              style={[
                styles.dateCard,
                { backgroundColor: isSelected ? Colors.primary : card, borderColor: isSelected ? Colors.primary : border },
              ]}
              onPress={() => setSelectedDate(iso)}
              activeOpacity={0.8}
            >
              <Text style={[styles.dayName, { color: isSelected ? '#fff' : subText }]}>
                {DAYS[d.getDay()]}
              </Text>
              <Text style={[styles.dateNum, { color: isSelected ? '#fff' : textColor }]}>
                {d.getDate()}
              </Text>
              <Text style={[styles.monthName, { color: isSelected ? '#fff' : subText }]}>
                {MONTHS[d.getMonth()]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Time Slots */}
      <Text style={[styles.sectionLabel, { color: subText }]}>SELECT TIME</Text>
      <RNView style={styles.slotGrid}>
        {TIME_SLOTS.map(t => {
          const isSelected = t === selectedTime;
          return (
            <TouchableOpacity
              key={t}
              style={[
                styles.slot,
                { backgroundColor: isSelected ? Colors.primary : card, borderColor: isSelected ? Colors.primary : border },
              ]}
              onPress={() => setSelectedTime(t)}
              activeOpacity={0.8}
            >
              <Text style={[styles.slotText, { color: isSelected ? '#fff' : textColor }]}>
                {formatTime(t)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </RNView>

      {/* Consultation Type */}
      <Text style={[styles.sectionLabel, { color: subText }]}>CONSULTATION TYPE</Text>
      <RNView style={styles.typeRow}>
        {TYPES.map(t => {
          const isSelected = t.id === selectedType;
          return (
            <TouchableOpacity
              key={t.id}
              style={[
                styles.typeCard,
                { backgroundColor: isSelected ? Colors.primary : card, borderColor: isSelected ? Colors.primary : border },
              ]}
              onPress={() => setSelectedType(t.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.typeIcon}>{t.icon}</Text>
              <Text style={[styles.typeLabel, { color: isSelected ? '#fff' : textColor }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </RNView>

      {/* Duration */}
      <Text style={[styles.sectionLabel, { color: subText }]}>DURATION</Text>
      <RNView style={[styles.durationRow, { backgroundColor: card, borderColor: border }]}>
        {([15, 30] as const).map(d => {
          const isSelected = d === selectedDuration;
          return (
            <TouchableOpacity
              key={d}
              style={[styles.durationBtn, isSelected && { backgroundColor: Colors.primary }]}
              onPress={() => setSelectedDuration(d)}
              activeOpacity={0.8}
            >
              <Text style={[styles.durationText, { color: isSelected ? '#fff' : textColor }]}>
                {d} min
              </Text>
              <Text style={[styles.durationCharge, { color: isSelected ? 'rgba(255,255,255,0.75)' : subText }]}>
                ₹{CHARGES[selectedType][d]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </RNView>

      {/* Summary */}
      <RNView style={[styles.summary, { backgroundColor: card, borderColor: border }]}>
        <Text style={[styles.summaryTitle, { color: textColor }]}>Consultation Summary</Text>
        <RNView style={styles.summaryRow}>
          <Text style={{ color: subText }}>Type</Text>
          <Text style={{ color: textColor, fontWeight: '600' }}>
            {TYPES.find(t => t.id === selectedType)?.label}
          </Text>
        </RNView>
        <RNView style={styles.summaryRow}>
          <Text style={{ color: subText }}>Duration</Text>
          <Text style={{ color: textColor, fontWeight: '600' }}>{selectedDuration} minutes</Text>
        </RNView>
        <RNView style={styles.summaryRow}>
          <Text style={{ color: subText }}>Date</Text>
          <Text style={{ color: textColor, fontWeight: '600' }}>
            {selectedDate.split('-').reverse().join('/')}
          </Text>
        </RNView>
        <RNView style={styles.summaryRow}>
          <Text style={{ color: subText }}>Time</Text>
          <Text style={{ color: textColor, fontWeight: '600' }}>
            {selectedTime ? formatTime(selectedTime) : '—'}
          </Text>
        </RNView>
        <RNView style={[styles.summaryRow, styles.summaryTotal, { borderTopColor: border }]}>
          <Text style={{ color: textColor, fontWeight: '700', fontSize: 16 }}>Total</Text>
          <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: 20 }}>₹{charge}</Text>
        </RNView>
      </RNView>

      <TouchableOpacity
        style={[styles.confirmBtn, submitting && { opacity: 0.7 }]}
        onPress={handleConfirm}
        disabled={submitting}
        activeOpacity={0.85}
      >
        {submitting
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.confirmText}>Confirm Booking</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 28,
    marginBottom: 12,
  },
  dateRow: { marginHorizontal: -20, paddingHorizontal: 20 },
  dateCard: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 10,
    minWidth: 62,
  },
  dayName: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  dateNum: { fontSize: 22, fontWeight: '800', marginVertical: 4 },
  monthName: { fontSize: 11 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    width: '23%',
    alignItems: 'center',
  },
  slotText: { fontSize: 12, fontWeight: '600' },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeIcon: { fontSize: 24, marginBottom: 6 },
  typeLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  durationRow: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  durationBtn: { flex: 1, alignItems: 'center', paddingVertical: 18 },
  durationText: { fontSize: 18, fontWeight: '700' },
  durationCharge: { fontSize: 13, marginTop: 4 },
  summary: { marginTop: 28, borderRadius: 12, borderWidth: 1, padding: 16 },
  summaryTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryTotal: { marginTop: 8, paddingTop: 14, borderTopWidth: 1 },
  confirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
