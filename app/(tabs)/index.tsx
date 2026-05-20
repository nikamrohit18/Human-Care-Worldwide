import { StyleSheet, ScrollView, TouchableOpacity, View as RNView } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

const SERVICES = [
  { label: 'Ground Ambulance', route: '/services/ground-ambulance', icon: '🚑' },
  { label: 'Hospital Assistance', route: '/services/hospital-assistance', icon: '🏥' },
  { label: 'Hospitalization Support', route: '/services/hospitalization-support', icon: '🩺' },
  { label: 'Tele Consultation & House Call', route: '/services/tele-consultation', icon: '📱' },
  { label: 'Home Healthcare', route: '/services/home-healthcare', icon: '🏠' },
  { label: 'Mortal Remains', route: '/services/mortal-remains', icon: '🕊️' },
  { label: 'Corporate Medical Solution', route: '/services/corporate-medical', icon: '🏢' },
  { label: 'Private Charter Service', route: '/services/private-charter', icon: '✈️' },
  { label: 'Rotary Wing Repatriation', route: '/services/rotary-wing-repatriation', icon: '🚁' },
  { label: 'Commercial Airline', route: '/services/commercial-airline', icon: '🛫' },
];

export default function HomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <RNView style={styles.hero}>
          <Text style={styles.heroTitle}>Human Care Worldwide</Text>
          <Text style={styles.heroTagline}>Your global medical assistance partner</Text>
        </RNView>

        {/* Emergency Banner */}
        <RNView style={styles.bannerWrapper}>
          <TouchableOpacity
            style={[styles.emergencyBanner, isDark && styles.emergencyBannerDark]}
            onPress={() => router.navigate('/(tabs)/emergency')}
            activeOpacity={0.85}
          >
            <Text style={styles.bannerIcon}>🚨</Text>
            <RNView style={styles.bannerTextGroup}>
              <Text style={styles.bannerTitle}>Medical Emergency?</Text>
              <Text style={styles.bannerSubtitle}>Tap for immediate assistance</Text>
            </RNView>
            <Text style={[styles.bannerArrow, { color: Colors.primary }]}>›</Text>
          </TouchableOpacity>
        </RNView>

        {/* Services Grid */}
        <RNView style={styles.section}>
          <Text style={styles.sectionTitle}>Our Services</Text>
          <RNView style={styles.grid}>
            {SERVICES.map((service) => (
              <TouchableOpacity
                key={service.route}
                style={[styles.card, isDark && styles.cardDark]}
                onPress={() => router.push(service.route as any)}
                activeOpacity={0.75}
              >
                <Text style={styles.cardIcon}>{service.icon}</Text>
                <Text style={styles.cardLabel}>{service.label}</Text>
              </TouchableOpacity>
            ))}
          </RNView>
        </RNView>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // Hero
  hero: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 52,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
  },
  heroTagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.2,
  },

  // Emergency Banner
  bannerWrapper: {
    paddingHorizontal: 20,
    marginTop: -26,
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  emergencyBannerDark: {
    backgroundColor: '#1E1E1E',
  },
  bannerIcon: {
    fontSize: 32,
    marginRight: 14,
  },
  bannerTextGroup: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 13,
    opacity: 0.55,
  },
  bannerArrow: {
    fontSize: 30,
    fontWeight: '300',
    lineHeight: 32,
  },

  // Services
  section: {
    padding: 20,
    paddingTop: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47.5%',
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    padding: 18,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: '#1E1E1E',
  },
  cardIcon: {
    fontSize: 34,
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});
