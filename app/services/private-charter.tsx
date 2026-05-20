import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';

export default function PrivateCharterScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.icon}>✈️</Text>
      <Text style={styles.title}>Private Charter Service</Text>
      <Text style={styles.description}>
        Dedicated air ambulance and medical charter flights for patients requiring urgent long-distance transport. Fully equipped aircraft with ICU-level care and specialist medical teams on board.
      </Text>
      <TouchableOpacity style={styles.cta} activeOpacity={0.85}>
        <Text style={styles.ctaText}>Request Charter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, alignItems: 'center' },
  icon: { fontSize: 64, marginTop: 24, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  description: { fontSize: 15, lineHeight: 24, textAlign: 'center', opacity: 0.7, marginBottom: 40 },
  cta: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 48 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
