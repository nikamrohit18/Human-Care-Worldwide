import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';

export default function HomeHealthcareScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.icon}>🏠</Text>
      <Text style={styles.title}>Home Healthcare</Text>
      <Text style={styles.description}>
        Professional medical care delivered to your doorstep — nursing, physiotherapy, post-operative care, and chronic disease management by qualified healthcare professionals.
      </Text>
      <TouchableOpacity style={styles.cta} activeOpacity={0.85}>
        <Text style={styles.ctaText}>Schedule Home Visit</Text>
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
