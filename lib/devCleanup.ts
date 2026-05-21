// One-shot dev utility — call once to clear legacy AsyncStorage consultation
// keys and cancel all locally-scheduled reminder notifications.
// Remove the call site (or this file) after cleanup is confirmed.

import AsyncStorage from '@react-native-async-storage/async-storage';

export async function clearLegacyConsultationData(): Promise<void> {
  // Cancel all scheduled local notifications (expo-notifications, native only)
  try {
    const Notifications = require('expo-notifications');
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Not available on web — safe to ignore
  }

  // Remove all AsyncStorage keys that belonged to the old consultation store
  // (pattern: hcw_consultations_<uid>)
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const consultationKeys = allKeys.filter(k => k.startsWith('hcw_consultations_'));
    if (consultationKeys.length > 0) {
      await AsyncStorage.multiRemove(consultationKeys);
    }
  } catch {
    // Ignore
  }
}
