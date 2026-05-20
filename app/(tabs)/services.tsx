import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';

const ALL_SERVICES = [
  { label: 'Ground Ambulance', route: '/services/ground-ambulance', icon: '🚑' },
  { label: 'Hospital Assistance', route: '/services/hospital-assistance', icon: '🏥' },
  { label: 'Domestic & International Hospitalization Support', route: '/services/hospitalization-support', icon: '🩺' },
  { label: 'Tele Consultation & House Call', route: '/services/tele-consultation', icon: '📱' },
  { label: 'Home Healthcare', route: '/services/home-healthcare', icon: '🏠' },
  { label: 'Mortal Remains', route: '/services/mortal-remains', icon: '🕊️' },
  { label: 'Corporate Medical Solution', route: '/services/corporate-medical', icon: '🏢' },
  { label: 'Private Charter Service', route: '/services/private-charter', icon: '✈️' },
  { label: 'Rotary Wing Medical Repatriation', route: '/services/rotary-wing-repatriation', icon: '🚁' },
  { label: 'Commercial Airline', route: '/services/commercial-airline', icon: '🛫' },
];

export default function ServicesScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>All Services</Text>
      {ALL_SERVICES.map((service) => (
        <TouchableOpacity
          key={service.route}
          style={styles.row}
          onPress={() => router.push(service.route as any)}
          activeOpacity={0.7}>
          <Text style={styles.icon}>{service.icon}</Text>
          <Text style={styles.label}>{service.label}</Text>
          <Text style={styles.arrow}>›</Text>
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
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  icon: {
    fontSize: 24,
    marginRight: 14,
    width: 32,
    textAlign: 'center',
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  arrow: {
    fontSize: 22,
    opacity: 0.4,
  },
});
