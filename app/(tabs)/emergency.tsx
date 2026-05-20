import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';

const EMERGENCY_SERVICES = [
  { label: 'Ground Ambulance', route: '/services/ground-ambulance', icon: '🚑' },
  { label: 'Rotary Wing Medical Repatriation', route: '/services/rotary-wing-repatriation', icon: '🚁' },
  { label: 'Private Charter Service', route: '/services/private-charter', icon: '✈️' },
];

export default function EmergencyScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Emergency Services</Text>
      <Text style={styles.subtitle}>Immediate assistance available 24/7</Text>
      {EMERGENCY_SERVICES.map((service) => (
        <TouchableOpacity
          key={service.route}
          style={styles.card}
          onPress={() => router.push(service.route as any)}
          activeOpacity={0.8}>
          <Text style={styles.cardIcon}>{service.icon}</Text>
          <Text style={styles.cardLabel}>{service.label}</Text>
          <Text style={styles.cardArrow}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
  },
  heading: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
  },
  cardIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  cardLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cardArrow: {
    fontSize: 24,
    color: '#fff',
    opacity: 0.8,
  },
});
