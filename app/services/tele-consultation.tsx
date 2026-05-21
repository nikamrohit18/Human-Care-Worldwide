import { StyleSheet, ScrollView, TouchableOpacity, View as RNView } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';

export default function TeleConsultationScreen() {
  const router = useRouter();
  const { profile } = useAuth();

  const isDoctor =
    profile?.accountType === 'partners' && profile?.partnerType === 'doctor';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.icon}>📱</Text>
      <Text style={styles.title}>Tele Consultation{'\n'}& House Call</Text>
      <Text style={styles.description}>
        Consult certified doctors from the comfort of your home via video or phone, or schedule
        a house call for in-person care. Available around the clock for urgent and routine medical
        needs.
      </Text>

      {isDoctor ? (
        /* ── Doctor view ── */
        <RNView style={styles.btnCol}>
          <TouchableOpacity
            style={styles.cta}
            activeOpacity={0.85}
            onPress={() => router.push('/services/tele-consultation-doctor' as any)}
          >
            <Text style={styles.ctaText}>My Consultations</Text>
          </TouchableOpacity>
        </RNView>
      ) : (
        /* ── Patient / guest view ── */
        <RNView style={styles.btnCol}>
          <TouchableOpacity
            style={styles.cta}
            activeOpacity={0.85}
            onPress={() => router.push('/services/tele-consultation-book' as any)}
          >
            <Text style={styles.ctaText}>Book Consultation</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cta, styles.ctaOutline]}
            activeOpacity={0.85}
            onPress={() => router.push('/services/tele-consultation-appointments' as any)}
          >
            <Text style={[styles.ctaText, { color: Colors.primary }]}>My Appointments</Text>
          </TouchableOpacity>
        </RNView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, alignItems: 'center' },
  icon: { fontSize: 64, marginTop: 24, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  description: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 40,
  },
  btnCol: { width: '100%', gap: 12 },
  cta: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
