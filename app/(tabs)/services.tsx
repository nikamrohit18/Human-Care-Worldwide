import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { useLanguage } from '@/context/LanguageContext';

export default function ServicesScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  const ALL_SERVICES = [
    { label: t.svcGroundAmbulance, route: '/services/ground-ambulance', icon: '🚑' },
    { label: t.svcHospitalAssistance, route: '/services/hospital-assistance', icon: '🏥' },
    { label: t.svcHospitalizationSupport, route: '/services/hospitalization-support', icon: '🩺' },
    { label: t.svcTeleConsultation, route: '/services/tele-consultation', icon: '📱' },
    { label: t.svcHomeHealthcare, route: '/services/home-healthcare', icon: '🏠' },
    { label: t.svcMortalRemains, route: '/services/mortal-remains', icon: '🕊️' },
    { label: t.svcCorporateMedical, route: '/services/corporate-medical', icon: '🏢' },
    { label: t.svcPrivateCharter, route: '/services/private-charter', icon: '✈️' },
    { label: t.svcRotaryWing, route: '/services/rotary-wing-repatriation', icon: '🚁' },
    { label: t.svcCommercialAirline, route: '/services/commercial-airline', icon: '🛫' },
    { label: t.svcFlightTracking, route: '/services/flight-tracking', icon: '🛩️' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>{t.allServices}</Text>
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
