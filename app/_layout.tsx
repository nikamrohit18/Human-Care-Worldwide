import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'welcome',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

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
        <Stack.Screen name="services/ground-ambulance" options={{ title: 'Ground Ambulance' }} />
        <Stack.Screen name="services/hospital-assistance" options={{ title: 'Hospital Assistance' }} />
        <Stack.Screen name="services/hospitalization-support" options={{ title: 'Hospitalization Support' }} />
        <Stack.Screen name="services/tele-consultation" options={{ title: 'Tele Consultation & House Call' }} />
        <Stack.Screen name="services/home-healthcare" options={{ title: 'Home Healthcare' }} />
        <Stack.Screen name="services/mortal-remains" options={{ title: 'Mortal Remains' }} />
        <Stack.Screen name="services/corporate-medical" options={{ title: 'Corporate Medical Solution' }} />
        <Stack.Screen name="services/private-charter" options={{ title: 'Private Charter Service' }} />
        <Stack.Screen name="services/rotary-wing-repatriation" options={{ title: 'Rotary Wing Repatriation' }} />
        <Stack.Screen name="services/commercial-airline" options={{ title: 'Commercial Airline' }} />
      </Stack>
    </ThemeProvider>
  );
}
