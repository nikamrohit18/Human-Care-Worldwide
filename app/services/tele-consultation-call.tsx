import { useEffect, useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
  BackHandler,
  ActivityIndicator,
  View,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/Themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import {
  subscribeToConsultation,
  markRoomStarted,
  updateConsultationStatusFS,
  FirestoreConsultation,
} from '@/lib/firestoreConsultations';
import { ensureRoom, isConfigured } from '@/lib/dailyConfig';

const WebView: any =
  Platform.OS !== 'web'
    ? (() => { try { return require('react-native-webview').WebView; } catch { return null; } })()
    : null;

function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export default function TeleConsultationCallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, profile } = useAuth();

  const [consultation, setConsultation] = useState<FirestoreConsultation | null>(null);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [roomStartedAt, setRoomStartedAt] = useState<number | null>(null); // ms
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endedRef = useRef(false);
  const warningRef = useRef(false);
  const warningAnim = useRef(new Animated.Value(-60)).current;

  const isDoctor =
    profile?.accountType === 'partners' && profile?.partnerType === 'doctor';

  // Subscribe to consultation via Firestore (works for both patient and doctor)
  useEffect(() => {
    if (!id) return;
    const unsub = subscribeToConsultation(id, async (c) => {
      setConsultation(c);
      // Sync roomStartedAt: start timer computation as soon as the server
      // timestamp is present — regardless of which participant triggered it.
      if (c?.roomStartedAt) {
        setRoomStartedAt(c.roomStartedAt.toMillis());
      }
      // Prefetch the room URL as soon as we have the consultation
      if (c && !roomUrl) {
        const url = await ensureRoom(c.id);
        setRoomUrl(url);
      }
    });
    return unsub;
  }, [id]);

  // Timer: computed from the shared Firestore server timestamp so both
  // participants see perfectly synchronised countdowns.
  // Dependency on roomStartedAt — timer restarts only when the anchor changes.
  useEffect(() => {
    if (roomStartedAt === null || !consultation) return;

    const duration = consultation.duration * 60;

    const update = () => {
      const elapsed = Math.floor((Date.now() - roomStartedAt) / 1000);
      const left = Math.max(0, duration - elapsed);
      setSecondsLeft(left);

      if (left <= 120 && !warningRef.current) {
        warningRef.current = true;
        setShowWarning(true);
        Animated.spring(warningAnim, { toValue: 0, useNativeDriver: true }).start();
      }

      if (left <= 0) {
        clearInterval(timerRef.current!);
        endCall();
      }
    };

    update(); // immediate snapshot
    timerRef.current = setInterval(update, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [roomStartedAt, consultation?.duration]);

  const endCall = useCallback(async () => {
    if (endedRef.current) return;
    endedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    if (id) await updateConsultationStatusFS(id, 'completed');
    // Route doctor back to doctor screen, patient back to appointments
    router.replace(
      isDoctor
        ? ('/services/tele-consultation-doctor' as any)
        : ('/services/tele-consultation-appointments' as any),
    );
  }, [id, isDoctor, router]);

  const confirmEnd = useCallback(() => {
    if (Platform.OS === 'web') {
      if (window.confirm('End this consultation?')) endCall();
      return;
    }
    Alert.alert(
      'End Consultation?',
      'Are you sure you want to end this call?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Call', style: 'destructive', onPress: endCall },
      ],
    );
  }, [endCall]);

  // When user taps "Join": open video and mark room as started in Firestore.
  // markRoomStarted is a transaction — only the FIRST caller sets the timestamp;
  // subsequent callers (e.g. the second participant) are no-ops.
  const handleJoin = useCallback(async () => {
    setJoined(true);
    if (id) {
      try { await markRoomStarted(id); } catch {}
    }
  }, [id]);

  // Android hardware back → confirm before leaving
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (joined) { confirmEnd(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [joined, confirmEnd]);

  const timerRed = secondsLeft !== null && secondsLeft > 0 && secondsLeft <= 120;
  const timerDisplay = secondsLeft !== null ? formatTime(secondsLeft) : '--:--';

  // ── Loading: waiting for consultation data ────────────────────────────────

  if (!consultation) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading consultation…</Text>
      </View>
    );
  }

  // ── Waiting room: user has not joined yet ─────────────────────────────────

  if (!joined) {
    const otherJoined = roomStartedAt !== null;
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.waitIcon}>📹</Text>
        <Text style={styles.waitTitle}>
          {isDoctor ? `Patient: ${consultation.patientName}` : 'Tele Consultation'}
        </Text>
        <Text style={styles.waitSub}>
          {otherJoined
            ? 'The other participant has already joined.'
            : 'You will join a secure video room.'}
        </Text>

        {otherJoined && secondsLeft !== null && (
          <View style={[styles.timerPill, timerRed && styles.timerPillRed, { marginBottom: 24 }]}>
            <Text style={[styles.timerText, timerRed && styles.timerTextRed]}>
              {timerDisplay} remaining
            </Text>
          </View>
        )}

        {!roomUrl ? (
          <ActivityIndicator color={Colors.primary} style={{ marginBottom: 16 }} />
        ) : (
          <TouchableOpacity style={styles.joinBtn} onPress={handleJoin} activeOpacity={0.85}>
            <Text style={styles.joinBtnText}>▶  Join Call Now</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // ── Active call screen ────────────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      {/* ── Video area ── */}
      {isConfigured() ? (
        Platform.OS === 'web' ? (
          <WebIframe url={roomUrl!} />
        ) : WebView ? (
          <WebView
            source={{ uri: roomUrl! }}
            style={styles.fill}
            javaScriptEnabled
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback
            mediaCapturePermissionGrantType="grantIfSameHostElseDeny"
            onPermissionRequest={(e: any) => {
              e.nativeEvent.grant(e.nativeEvent.resources);
            }}
          />
        ) : (
          <Placeholder message="Run:  npx expo install react-native-webview" />
        )
      ) : (
        <Placeholder
          icon="📹"
          title="Video Call"
          message={`Set DAILY_DOMAIN in lib/dailyConfig.ts\nand add your DAILY_API_KEY\nto enable live video.\n\nSign up free at daily.co`}
        />
      )}

      {/* ── 2-minute warning banner ── */}
      {showWarning && (
        <Animated.View
          style={[styles.warningBanner, { transform: [{ translateY: warningAnim }] }]}
        >
          <Text style={styles.warningText}>⚠️  Call will end in 2 minutes</Text>
        </Animated.View>
      )}

      {/* ── HUD: timer + end-call ── */}
      <View
        style={[
          styles.hud,
          { paddingBottom: Math.max(insets.bottom, 24) },
          Platform.OS === 'web' && { zIndex: 30 },
        ]}
        pointerEvents={Platform.OS === 'web' ? 'auto' : 'box-none'}
      >
        <View style={[styles.timerPill, timerRed && styles.timerPillRed]}>
          <Text style={[styles.timerText, timerRed && styles.timerTextRed]}>
            {timerDisplay}
          </Text>
        </View>
        <TouchableOpacity style={styles.endBtn} onPress={confirmEnd} activeOpacity={0.85}>
          <Text style={styles.endBtnText}>End Call</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function WebIframe({ url }: { url: string }) {
  return (
    // @ts-ignore — <iframe> is valid HTML but not in RN type declarations
    <iframe
      src={url}
      style={{ flex: 1, border: 'none', width: '100%', height: '100%' }}
      allow="camera; microphone; fullscreen; display-capture"
      title="Video consultation"
    />
  );
}

function Placeholder({
  icon = '📹',
  title = 'Video Call',
  message,
}: {
  icon?: string;
  title?: string;
  message: string;
}) {
  return (
    <View style={[styles.fill, styles.placeholder]}>
      <Text style={styles.placeholderIcon}>{icon}</Text>
      <Text style={styles.placeholderTitle}>{title}</Text>
      <Text style={styles.placeholderMsg}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0D0D0D' },
  fill:   { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0D0D', padding: 32 },
  loadingText: { color: '#888', marginTop: 16, fontSize: 14 },

  // Waiting room
  waitIcon:  { fontSize: 64, marginBottom: 16 },
  waitTitle: { color: '#fff', fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  waitSub:   { color: '#9CA3AF', fontSize: 14, textAlign: 'center', marginBottom: 32 },
  joinBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  joinBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Placeholder
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
    padding: 32,
  },
  placeholderIcon:  { fontSize: 72, marginBottom: 16 },
  placeholderTitle: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 16 },
  placeholderMsg:   { color: '#9CA3AF', fontSize: 14, textAlign: 'center', lineHeight: 22 },

  // Warning banner
  warningBanner: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    alignItems: 'center',
    zIndex: 20,
  },
  warningText: { color: '#fff', fontWeight: '700', fontSize: 14, letterSpacing: 0.3 },

  // HUD
  hud: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  timerPill: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  timerPillRed: { backgroundColor: 'rgba(220,38,38,0.25)', borderColor: '#DC2626' },
  timerText:    { color: '#fff', fontSize: 24, fontWeight: '800', fontVariant: ['tabular-nums'] },
  timerTextRed: { color: '#FCA5A5' },
  endBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  endBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
