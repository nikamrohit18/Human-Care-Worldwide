import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { HeaderBackButton } from '@react-navigation/elements';
import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';

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
    if (loaded && Platform.OS !== 'web') {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // On web, render immediately using system-font fallbacks — blocking on font
  // load causes a blank-screen flash that is visible on every page refresh.
  if (!loaded && Platform.OS !== 'web') {
    return null;
  }

  return <RootLayoutNav />;
}

// Bypasses the native stack state on Expo Go where stale screens
// remain as ghost entries after back-navigation, causing the auto back
// button to target the wrong (invisible) screen on subsequent pushes.
function ServiceBackButton() {
  return (
    <HeaderBackButton
      onPress={() => router.navigate('/(tabs)' as any)}
      canGoBack
    />
  );
}

const serviceBack = Platform.OS !== 'web'
  ? { headerLeft: () => <ServiceBackButton /> }
  : {};

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ title: 'Create Account', headerBackTitle: 'Login' }} />
        <Stack.Screen name="forgot-password" options={{ title: 'Forgot Password', headerBackTitle: 'Login' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="services/ground-ambulance" options={{ title: 'Ground Ambulance', ...serviceBack }} />
        <Stack.Screen name="services/hospital-assistance" options={{ title: 'Hospital Assistance', ...serviceBack }} />
        <Stack.Screen name="services/hospitalization-support" options={{ title: 'Hospitalization Support', ...serviceBack }} />
        <Stack.Screen name="services/tele-consultation" options={{ title: 'Tele Consultation & House Call', ...serviceBack }} />
        <Stack.Screen name="services/home-healthcare" options={{ title: 'Home Healthcare', ...serviceBack }} />
        <Stack.Screen name="services/mortal-remains" options={{ title: 'Mortal Remains', ...serviceBack }} />
        <Stack.Screen name="services/corporate-medical" options={{ title: 'Corporate Medical Solution', ...serviceBack }} />
        <Stack.Screen name="services/private-charter" options={{ title: 'Private Charter Service', ...serviceBack }} />
        <Stack.Screen name="services/rotary-wing-repatriation" options={{ title: 'Rotary Wing Repatriation', ...serviceBack }} />
        <Stack.Screen name="services/commercial-airline" options={{ title: 'Commercial Airline', ...serviceBack }} />
      </Stack>
    </ThemeProvider>
  );
}
