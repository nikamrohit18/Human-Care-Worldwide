// Web stub — expo-notifications is native only.
// Metro automatically uses notifications.native.ts on iOS/Android.
import { Consultation } from '@/lib/consultationStorage';

export function setupNotifications(): void {}

export async function requestNotificationPermissions(): Promise<boolean> {
  return false;
}

export async function scheduleConsultationReminder(
  _c: Consultation,
): Promise<string | null> {
  return null;
}

export async function cancelConsultationReminder(
  _notificationId: string | undefined,
): Promise<void> {}

export async function registerPushTokenIfNeeded(_uid: string): Promise<void> {}

export async function scheduleReminderForDoctor(
  _c: Consultation,
): Promise<string | null> {
  return null;
}
