import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Themed';

export default function MortalRemainsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.icon}>🕊️</Text>
      <Text style={styles.title}>Mortal Remains</Text>
      <Text style={styles.description}>
        We provide compassionate and dignified repatriation of mortal remains — handling all documentation, legal clearances, and logistics to ensure a respectful journey home for your loved one.
      </Text>
      <TouchableOpacity style={styles.cta} activeOpacity={0.85}>
        <Text style={styles.ctaText}>Contact Us</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, alignItems: 'center' },
  icon: { fontSize: 64, marginTop: 24, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  description: { fontSize: 15, lineHeight: 24, textAlign: 'center', opacity: 0.7, marginBottom: 40 },
  cta: { backgroundColor: '#555', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 48 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
