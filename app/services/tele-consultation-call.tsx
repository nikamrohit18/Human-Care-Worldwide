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
import { loadConsultations, updateConsultationStatus, Consultation } from '@/lib/consultationStorage';
import { ensureRoom, isConfigured } from '@/lib/dailyConfig';

// Lazy-load WebView — avoids SSR issues and gracefully handles missing package
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
  const { user } = useAuth();

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endedRef = useRef(false);
  const warningRef = useRef(false);
  const warningAnim = useRef(new Animated.Value(-60)).current;

  // Load consultation then create/get the Daily.co room
  useEffect(() => {
    if (!user || !id) return;
    loadConsultations(user.uid).then(async list => {
      const c = list.find(x => x.id === id) ?? null;
      setConsultation(c);
      if (c) {
        const url = await ensureRoom(c.id);
        setRoomUrl(url);
      }
    });
  }, [user, id]);

  const endCall = useCallback(async () => {
    if (endedRef.current) return;
    endedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    if (user && id) await updateConsultationStatus(user.uid, id, 'completed');
    router.replace('/services/tele-consultation-appointments' as any);
  }, [user, id, router]);

  const confirmEnd = useCallback(() => {
    if (Platform.OS === 'web') {
      // window.confirm is reliable on web even when an iframe has focus;
      // Alert.alert on web can silently drop the callback in that context.
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

  // Start countdown once consultation is loaded
  useEffect(() => {
    if (!consultation) return;
    let remaining = consultation.duration * 60;
    setSecondsLeft(remaining);

    timerRef.current = setInterval(() => {
      remaining -= 1;
      setSecondsLeft(remaining);

      if (remaining === 120 && !warningRef.current) {
        warningRef.current = true;
        setShowWarning(true);
        Animated.spring(warningAnim, { toValue: 0, useNativeDriver: true }).start();
      }

      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        endCall();
      }
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [consultation?.id]);

  // Android hardware back → confirm before leaving
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { confirmEnd(); return true; });
    return () => sub.remove();
  }, [confirmEnd]);

  const timerRed = secondsLeft > 0 && secondsLeft <= 120;

  // Loading: waiting for consultation or room URL
  if (!consultation || !roomUrl) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>
          {!consultation ? 'Loading consultation…' : 'Preparing video room…'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* ── Video area ─────────────────────────────────────────────── */}
      {isConfigured() ? (
        Platform.OS === 'web' ? (
          // Web: <iframe> works perfectly for Daily.co
          <WebIframe url={roomUrl} />
        ) : WebView ? (
          <WebView
            source={{ uri: roomUrl }}
            style={styles.fill}
            javaScriptEnabled
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback
            // iOS 15+: auto-grant camera/mic to same-origin Daily.co frame
            mediaCapturePermissionGrantType="grantIfSameHostElseDeny"
            // Android: accept WebRTC camera/mic permission requests from the page
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
          message={
            `Set DAILY_DOMAIN in lib/dailyConfig.ts\nand add your DAILY_API_KEY\nto enable live video.\n\nSign up free at daily.co`
          }
        />
      )}

      {/* ── 2-minute warning banner ─────────────────────────────────── */}
      {showWarning && (
        <Animated.View
          style={[styles.warningBanner, { transform: [{ translateY: warningAnim }] }]}
        >
          <Text style={styles.warningText}>⚠️  Call will end in 2 minutes</Text>
        </Animated.View>
      )}

      {/* ── HUD: timer + end-call button ───────────────────────────── */}
      <View
        style={[
          styles.hud,
          { paddingBottom: Math.max(insets.bottom, 24) },
          // On web: box-none makes children inherit pointer-events:none via CSS,
          // so the button becomes unclickable. Use auto instead.
          Platform.OS === 'web' && { zIndex: 30 },
        ]}
        pointerEvents={Platform.OS === 'web' ? 'auto' : 'box-none'}
      >
        <View style={[styles.timerPill, timerRed && styles.timerPillRed]}>
          <Text style={[styles.timerText, timerRed && styles.timerTextRed]}>
            {formatTime(secondsLeft)}
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
  center: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0D0D' },
  loadingText: { color: '#888', marginTop: 16, fontSize: 14 },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
    padding: 32,
  },
  placeholderIcon:  { fontSize: 72, marginBottom: 16 },
  placeholderTitle: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 16 },
  placeholderMsg:   { color: '#9CA3AF', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  warningBanner: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    alignItems: 'center',
    zIndex: 20,
  },
  warningText: { color: '#fff', fontWeight: '700', fontSize: 14, letterSpacing: 0.3 },
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
