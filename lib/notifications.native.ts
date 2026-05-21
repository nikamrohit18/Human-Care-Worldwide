import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Consultation, ConsultationType } from '@/lib/consultationStorage';

const TYPE_LABEL: Record<ConsultationType, string> = {
  video:        'Video Call',
  phone:        'Phone Call',
  'house-call': 'House Call',
};

/** Call once at app startup (native only). Sets the foreground handler + Android channel. */
export function setupNotifications() {
  if (Platform.OS === 'web') return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('consultations', {
      name: 'Consultation Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C8102E',
    });
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedules a local notification 5 minutes before the consultation.
 * Returns the notification ID (store it so the reminder can be cancelled),
 * or null if the time has passed or permissions are denied.
 */
export async function scheduleConsultationReminder(
  c: Consultation,
): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const [year, month, day] = c.date.split('-').map(Number);
  const [hour, minute] = c.time.split(':').map(Number);
  const consultationAt = new Date(year, month - 1, day, hour, minute, 0);
  const notifyAt = new Date(consultationAt.getTime() - 5 * 60 * 1000);

  if (notifyAt <= new Date()) return null;

  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '⏰ Consultation Starting Soon',
      body: `Your ${c.duration}-min ${TYPE_LABEL[c.type]} starts in 5 minutes.`,
      sound: true,
      data: { consultationId: c.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: notifyAt,
    },
  });

  return id;
}

/** Cancels a previously scheduled reminder. Safe to call with undefined. */
export async function cancelConsultationReminder(
  notificationId: string | undefined,
): Promise<void> {
  if (Platform.OS === 'web' || !notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
