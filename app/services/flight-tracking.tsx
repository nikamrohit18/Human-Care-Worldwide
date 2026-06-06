import React, { useState } from 'react';
import {
  StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageContext';
import { searchFlights, FlightSummary } from '@/lib/flightTracking';
import { FR24_API_TOKEN } from '@/lib/fr24Config';

const PLACEHOLDER_TOKEN = 'your-api-token-here';

function extractTime(iso: string | null): string {
  if (!iso) return '—';
  const m = iso.match(/T(\d{2}:\d{2})/);
  return m ? m[1] : '—';
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isTodayOrFuture(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d >= today;
}

function FlightCard({ flight, onViewMap, mapLabel }: { flight: FlightSummary; onViewMap: () => void; mapLabel: string }) {
  const landed = flight.flight_ended === true || flight.flight_ended === 'true';
  const destIata = flight.dest_iata_actual || flight.dest_iata;
  const destIcao = flight.dest_icao_actual || flight.dest_icao;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.flightBadge}>
          <Text style={styles.flightBadgeText}>{flight.flight}</Text>
        </View>
        <View style={[styles.statusBadge, landed ? styles.statusLanded : styles.statusInFlight]}>
          <Text style={[styles.statusText, landed ? styles.statusTextLanded : styles.statusTextInFlight]}>
            {landed ? '✓  Landed' : '▶  In Flight'}
          </Text>
        </View>
      </View>

      <View style={styles.routeRow}>
        <View style={styles.airportBox}>
          <Text style={styles.iataCode}>{flight.orig_iata}</Text>
          <Text style={styles.icaoCode}>{flight.orig_icao}</Text>
        </View>
        <Text style={styles.routeArrow}>✈</Text>
        <View style={styles.airportBox}>
          <Text style={styles.iataCode}>{destIata}</Text>
          <Text style={styles.icaoCode}>{destIcao}</Text>
        </View>
      </View>

      <View style={styles.timeRow}>
        <View style={styles.timeBox}>
          <Text style={styles.timeLabel}>Departure</Text>
          <Text style={styles.timeValue}>{extractTime(flight.datetime_takeoff)}</Text>
        </View>
        <View style={styles.timeBox}>
          <Text style={styles.timeLabel}>Arrival</Text>
          <Text style={styles.timeValue}>{extractTime(flight.datetime_landed)}</Text>
        </View>
        <View style={styles.timeBox}>
          <Text style={styles.timeLabel}>Duration</Text>
          <Text style={styles.timeValue}>{formatDuration(flight.flight_time)}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{flight.type || '—'}  ·  {flight.reg || '—'}</Text>
        <Text style={styles.metaText}>{flight.operated_as}</Text>
      </View>

      {!!flight.actual_distance && (
        <Text style={styles.distanceText}>
          {Math.round(flight.actual_distance).toLocaleString()} km
        </Text>
      )}

      <TouchableOpacity style={styles.mapBtn} onPress={onViewMap} activeOpacity={0.8}>
        <Text style={styles.mapBtnText}>🗺  {mapLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function FlightTrackingScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [flightNumber, setFlightNumber] = useState('');
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FlightSummary[]>([]);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const apiConfigured = FR24_API_TOKEN !== PLACEHOLDER_TOKEN;
  const atToday = isTodayOrFuture(date);

  function shiftDay(delta: number) {
    setDate(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + delta);
      if (delta > 0 && isTodayOrFuture(next)) return prev;
      return next;
    });
    setSearched(false);
    setResults([]);
    setErrorMsg('');
  }

  async function handleSearch() {
    if (!flightNumber.trim()) return;
    setLoading(true);
    setErrorMsg('');
    setSearched(false);
    setResults([]);
    try {
      const data = await searchFlights(flightNumber.trim(), date);
      setResults(data);
      setSearched(true);
    } catch (e: any) {
      setErrorMsg(e.message ?? 'Failed to fetch flight data.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled">
      <Text style={styles.icon}>✈️</Text>
      <Text style={styles.title}>{t.svcFlightTracking}</Text>
      <Text style={styles.description}>
        Search real-time and historical flight information worldwide, powered by FlightRadar24.
      </Text>

      {!apiConfigured ? (
        <View style={styles.configWarning}>
          <Text style={styles.configWarningText}>
            FR24 API key not configured.{'\n\n'}
            Copy <Text style={styles.mono}>lib/fr24Config.example.ts</Text> →{' '}
            <Text style={styles.mono}>lib/fr24Config.ts</Text> and add your token from{' '}
            fr24api.flightradar24.com.
          </Text>
        </View>
      ) : (
        <View style={styles.searchCard}>
          <TextInput
            style={styles.input}
            placeholder={t.enterFlightNum}
            placeholderTextColor="#999"
            value={flightNumber}
            onChangeText={text => {
              setFlightNumber(text);
              setSearched(false);
            }}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />

          <View style={styles.dateRow}>
            <TouchableOpacity onPress={() => shiftDay(-1)} style={styles.dateArrow} hitSlop={8}>
              <Text style={styles.dateArrowText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.dateText}>{formatDate(date)}</Text>
            <TouchableOpacity
              onPress={() => shiftDay(1)}
              style={styles.dateArrow}
              disabled={atToday}
              hitSlop={8}>
              <Text style={[styles.dateArrowText, atToday && styles.dateArrowDisabled]}>›</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.searchBtn, !flightNumber.trim() && styles.searchBtnDisabled]}
            onPress={handleSearch}
            activeOpacity={0.85}
            disabled={!flightNumber.trim() || loading}>
            <Text style={styles.searchBtnText}>{t.trackFlight}</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      )}

      {!loading && !!errorMsg && (
        <Text style={styles.errorText} selectable>{errorMsg}</Text>
      )}

      {!loading && !errorMsg && searched && results.length === 0 && (
        <Text style={styles.emptyText}>{t.flightNotFound}</Text>
      )}

      {!loading && results.map(flight => (
        <FlightCard
          key={flight.fr24_id}
          flight={flight}
          mapLabel={t.viewOnMap}
          onViewMap={() => router.push({
            pathname: '/services/flight-tracking-map',
            params: {
              fr24Id:     flight.fr24_id,
              flightNum:  flight.flight,
              origIata:   flight.orig_iata,
              origIcao:   flight.orig_icao,
              destIata:   flight.dest_iata_actual || flight.dest_iata,
              destIcao:   flight.dest_icao_actual || flight.dest_icao,
              takeoff:    flight.datetime_takeoff   ?? '',
              flightTime: String(flight.flight_time ?? 0),
              aircraft:   flight.type  ?? '',
              reg:        flight.reg   ?? '',
              flightEnded: String(flight.flight_ended),
              departure:  extractTime(flight.datetime_takeoff),
              arrival:    extractTime(flight.datetime_landed),
            },
          } as any)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, alignItems: 'center', paddingBottom: 48 },
  icon: { fontSize: 64, marginTop: 16, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  description: {
    fontSize: 14, lineHeight: 22, textAlign: 'center', opacity: 0.65, marginBottom: 28,
  },

  configWarning: {
    backgroundColor: '#FFF3CD', borderRadius: 14, padding: 20, width: '100%',
  },
  configWarningText: { color: '#856404', fontSize: 14, lineHeight: 22, textAlign: 'center' },
  mono: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12 },

  searchCard: {
    width: '100%', borderRadius: 16, padding: 16, gap: 12,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  input: {
    height: 52, borderWidth: 1, borderColor: '#ddd', borderRadius: 12,
    paddingHorizontal: 16, fontSize: 16, backgroundColor: '#fff', color: '#000',
    letterSpacing: 1,
  },
  dateRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  dateArrow: { paddingHorizontal: 16, paddingVertical: 8 },
  dateArrowText: { fontSize: 32, color: Colors.primary, fontWeight: '300', lineHeight: 36 },
  dateArrowDisabled: { opacity: 0.25 },
  dateText: { fontSize: 16, fontWeight: '500', minWidth: 140, textAlign: 'center' },
  searchBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  searchBtnDisabled: { opacity: 0.45 },
  searchBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  loader: { marginTop: 48 },
  errorText: {
    color: Colors.primary, marginTop: 24, textAlign: 'center',
    fontSize: 14, lineHeight: 20,
  },
  emptyText: {
    marginTop: 36, textAlign: 'center', opacity: 0.55,
    fontSize: 14, lineHeight: 22,
  },

  // Flight card
  card: {
    width: '100%', borderRadius: 16, padding: 18, marginTop: 16,
    borderWidth: StyleSheet.hairlineWidth, borderColor: '#ddd',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16, backgroundColor: 'transparent',
  },
  flightBadge: {
    backgroundColor: Colors.primary, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  flightBadgeText: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 0.5 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  statusLanded: { backgroundColor: '#D4EDDA' },
  statusInFlight: { backgroundColor: '#CCE5FF' },
  statusText: { fontSize: 12, fontWeight: '600' },
  statusTextLanded: { color: '#155724' },
  statusTextInFlight: { color: '#004085' },

  routeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 18, backgroundColor: 'transparent',
  },
  airportBox: { alignItems: 'center', flex: 1, backgroundColor: 'transparent' },
  iataCode: { fontSize: 28, fontWeight: '800', letterSpacing: 1 },
  icaoCode: { fontSize: 11, opacity: 0.45, marginTop: 2 },
  routeArrow: { fontSize: 22, color: Colors.primary, marginHorizontal: 4 },

  timeRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    marginBottom: 14, backgroundColor: 'transparent',
  },
  timeBox: { alignItems: 'center', backgroundColor: 'transparent' },
  timeLabel: { fontSize: 11, opacity: 0.5, marginBottom: 4, textTransform: 'uppercase' },
  timeValue: { fontSize: 20, fontWeight: '700' },

  metaRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#eee',
    paddingTop: 10, marginTop: 4, backgroundColor: 'transparent',
  },
  metaText: { fontSize: 12, opacity: 0.55 },
  distanceText: { fontSize: 12, opacity: 0.4, textAlign: 'center', marginTop: 6 },
  mapBtn: {
    marginTop: 14, borderWidth: 1.5, borderColor: Colors.primary,
    borderRadius: 10, paddingVertical: 9, alignItems: 'center',
  },
  mapBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
});
