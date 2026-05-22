import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { HeaderBackButton } from '@react-navigation/elements';
import { useFonts } from 'expo-font';
import { Stack, router, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import Colors from '@/constants/Colors';
import { setupNotifications, registerPushTokenIfNeeded } from '@/lib/notifications';
import { clearLegacyConsultationData } from '@/lib/devCleanup';
import { LanguageToggle } from '@/components/LanguageToggle';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'welcome',
};

// On native, hold the OS splash until fonts are ready.
// On web the OS splash API is a no-op and calling it causes the brief
// white-circle flash, so skip it entirely on web.
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    setupNotifications();
    clearLegacyConsultationData(); // one-shot: clears old AsyncStorage keys + cancels stale notifications
  }, []);

  useEffect(() => {
    if (loaded && Platform.OS !== 'web') {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // On web, render immediately using system-font fallbacks — blocking on font
  // load causes a blank-screen flash that is visible on every page refresh.
  if (!loaded && Platform.OS !== 'web') {
    return null;
  }

  return (
    <LanguageProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </LanguageProvider>
  );
}

// Bypasses the native stack state on Expo Go where stale screens
// remain as ghost entries after back-navigation, causing the auto back
// button to target the wrong (invisible) screen on subsequent pushes.
function ServiceBackButton() {
  return (
    <HeaderBackButton
      onPress={() => router.navigate('/(tabs)' as any)}
    />
  );
}

function WelcomeBackButton() {
  return (
    <HeaderBackButton
      label="Login"
      onPress={() => router.navigate('/welcome' as any)}
    />
  );
}

const serviceBack = { headerLeft: () => <ServiceBackButton /> };
const welcomeBack = { headerLeft: () => <WelcomeBackButton /> };
const withToggle = { headerRight: () => <LanguageToggle /> };

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, profile, loading } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const segments = useSegments();
  const nav = useRouter();
  // Auth redirect guard
  useEffect(() => {
    if (loading) return;
    const authScreens = ['welcome', 'register', 'forgot-password'];
    const onAuthScreen = authScreens.includes(segments[0] as string);
    if (user && onAuthScreen) {
      nav.replace('/(tabs)');
    } else if (!user && !onAuthScreen) {
      nav.replace('/welcome');
    }
  }, [user, loading, segments]);

  // Register Expo push token in Firestore whenever the user signs in
  useEffect(() => {
    if (user) registerPushTokenIfNeeded(user.uid);
  }, [user?.uid]);

  // Sync language from loaded profile (cross-device)
  useEffect(() => {
    if (profile?.language && profile.language !== language) {
      setLanguage(profile.language);
    }
  }, [profile?.language]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ title: t.createAccount, headerBackTitle: 'Login', ...welcomeBack }} />
        <Stack.Screen name="forgot-password" options={{ title: t.forgotPassword, headerBackTitle: 'Login', ...welcomeBack }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="services/ground-ambulance" options={{ title: t.svcGroundAmbulance, ...serviceBack, ...withToggle }} />
        <Stack.Screen name="services/hospital-assistance" options={{ title: t.svcHospitalAssistance, ...serviceBack, ...withToggle }} />
        <Stack.Screen name="services/hospitalization-support" options={{ title: t.svcHospitalizationSupport, ...serviceBack, ...withToggle }} />
        <Stack.Screen name="services/tele-consultation" options={{ title: t.svcTeleConsultation, ...serviceBack, ...withToggle }} />
        <Stack.Screen name="services/tele-consultation-book" options={{ title: t.bookConsultation, ...withToggle }} />
        <Stack.Screen name="services/tele-consultation-appointments" options={{ title: t.myAppointments, ...withToggle }} />
        <Stack.Screen name="services/tele-consultation-call" options={{ headerShown: false }} />
        <Stack.Screen name="services/tele-consultation-doctor" options={{ title: t.myAppointments, ...serviceBack, ...withToggle }} />
        <Stack.Screen name="services/home-healthcare" options={{ title: t.svcHomeHealthcare, ...serviceBack, ...withToggle }} />
        <Stack.Screen name="services/mortal-remains" options={{ title: t.svcMortalRemains, ...serviceBack, ...withToggle }} />
        <Stack.Screen name="services/corporate-medical" options={{ title: t.svcCorporateMedical, ...serviceBack, ...withToggle }} />
        <Stack.Screen name="services/private-charter" options={{ title: t.svcPrivateCharter, ...serviceBack, ...withToggle }} />
        <Stack.Screen name="services/rotary-wing-repatriation" options={{ title: t.svcRotaryWing, ...serviceBack, ...withToggle }} />
        <Stack.Screen name="services/commercial-airline" options={{ title: t.svcCommercialAirline, ...serviceBack, ...withToggle }} />
      </Stack>
    </ThemeProvider>
  );
}
