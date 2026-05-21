import { getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { Platform } from 'react-native';

// ─── Firebase project config ────────────────────────────────────────────────
// 1. Go to https://console.firebase.google.com
// 2. Create a project (or use an existing one)
// 3. Add a Web app  →  copy the config object below
// 4. In Firebase Console → Authentication → Sign-in method → enable Email/Password
const firebaseConfig = {
  apiKey: "AIzaSyAsCDJNoKY21XXfsDKQig3-jg0w-1QNqj0",
  authDomain: "human-care-worldwide.firebaseapp.com",
  projectId: "human-care-worldwide",
  storageBucket: "human-care-worldwide.firebasestorage.app",
  messagingSenderId: "412443746846",
  appId: "1:412443746846:web:728c0ac907d2777960840f"
};
// ─────────────────────────────────────────────────────────────────────────────

// Re-use an existing app on hot reload to avoid "already initialized" errors.
export const firebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

// On web Firebase uses localStorage automatically.
// On native we load getReactNativePersistence from the RN bundle at runtime
// (Firebase 12 browser types don't expose it, but Metro resolves it correctly).
function createAuth() {
  if (Platform.OS === 'web') return getAuth(firebaseApp);
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getReactNativePersistence } = require('firebase/auth');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(firebaseApp);
  }
}

export const auth = createAuth();
