import AsyncStorage from '@react-native-async-storage/async-storage';

export type ConsultationType = 'video' | 'phone' | 'house-call';
export type ConsultationStatus = 'upcoming' | 'completed' | 'cancelled';

export interface Consultation {
  id: string;
  userId: string;
  date: string;      // YYYY-MM-DD
  time: string;      // HH:mm 24h
  type: ConsultationType;
  duration: 15 | 30;
  charge: number;
  status: ConsultationStatus;
  createdAt: string; // ISO
  _transcript?: string; // internal only, never shown to user
}

export const CHARGES: Record<ConsultationType, Record<15 | 30, number>> = {
  video:        { 15: 299,  30: 499  },
  phone:        { 15: 199,  30: 349  },
  'house-call': { 15: 999,  30: 1499 },
};

const KEY = (uid: string) => `hcw_consultations_${uid}`;

export async function loadConsultations(uid: string): Promise<Consultation[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY(uid));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveConsultation(c: Consultation): Promise<void> {
  const list = await loadConsultations(c.userId);
  const idx = list.findIndex(x => x.id === c.id);
  if (idx >= 0) list[idx] = c;
  else list.push(c);
  await AsyncStorage.setItem(KEY(c.userId), JSON.stringify(list));
}

export async function updateConsultationStatus(
  uid: string,
  id: string,
  status: ConsultationStatus,
): Promise<void> {
  const list = await loadConsultations(uid);
  const idx = list.findIndex(c => c.id === id);
  if (idx >= 0) {
    list[idx].status = status;
    await AsyncStorage.setItem(KEY(uid), JSON.stringify(list));
  }
}
