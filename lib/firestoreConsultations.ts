import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type ConsultationType = 'video' | 'phone' | 'house-call';
export type ConsultationStatus = 'pending' | 'accepted' | 'completed' | 'cancelled';

export interface FirestoreConsultation {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string | null;
  doctorName: string | null;
  date: string;             // YYYY-MM-DD
  time: string;             // HH:mm 24h
  type: ConsultationType;
  duration: 15 | 30;
  charge: number;
  status: ConsultationStatus;
  createdAt: string;        // ISO
  roomStartedAt: Timestamp | null;
  patientNotificationId: string | null;
  doctorNotificationId: string | null;
  dailyRoomName: string;    // Links to Daily.co recording in dashboard: humancare.daily.co/{dailyRoomName}
}

export const CHARGES: Record<ConsultationType, Record<15 | 30, number>> = {
  video:        { 15: 299,  30: 499  },
  phone:        { 15: 199,  30: 349  },
  'house-call': { 15: 999,  30: 1499 },
};

const COLL = 'consultations';

// Mirrors the room-name derivation in dailyConfig.ts so the stored name
// matches what was created in Daily.co.
function deriveDailyRoomName(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, '-').slice(-20);
}

// ── Patient: book a new consultation ─────────────────────────────────────────

export async function bookConsultation(
  c: Pick<FirestoreConsultation, 'id' | 'patientId' | 'patientName' | 'date' | 'time' | 'type' | 'duration' | 'charge' | 'createdAt'>,
): Promise<void> {
  await setDoc(doc(db, COLL, c.id), {
    ...c,
    status: 'pending',
    doctorId: null,
    doctorName: null,
    roomStartedAt: null,
    patientNotificationId: null,
    doctorNotificationId: null,
    dailyRoomName: deriveDailyRoomName(c.id),
  });
}

// ── Doctor: accept a pending consultation (atomic — only one doctor can win) ─

export async function acceptConsultation(
  consultationId: string,
  doctorId: string,
  doctorName: string,
): Promise<void> {
  const ref = doc(db, COLL, consultationId);
  await runTransaction(db, async (t) => {
    const snap = await t.get(ref);
    if (!snap.exists()) throw new Error('Consultation not found');
    if (snap.data().status !== 'pending') throw new Error('Already accepted by another doctor');
    t.update(ref, { status: 'accepted', doctorId, doctorName });
  });
}

// ── Status update (end call, cancel) ─────────────────────────────────────────

export async function updateConsultationStatusFS(
  consultationId: string,
  status: ConsultationStatus,
): Promise<void> {
  await updateDoc(doc(db, COLL, consultationId), { status });
}

// ── Store notification IDs so they can be cancelled later ────────────────────

export async function storeNotificationId(
  consultationId: string,
  field: 'patientNotificationId' | 'doctorNotificationId',
  notificationId: string,
): Promise<void> {
  await updateDoc(doc(db, COLL, consultationId), { [field]: notificationId });
}

// ── Timer sync: mark when the first participant enters the room ───────────────
// Uses a transaction so only the first caller writes; subsequent callers are no-ops.

export async function markRoomStarted(consultationId: string): Promise<void> {
  const ref = doc(db, COLL, consultationId);
  await runTransaction(db, async (t) => {
    const snap = await t.get(ref);
    if (snap.exists() && !snap.data().roomStartedAt) {
      t.update(ref, { roomStartedAt: serverTimestamp() });
    }
  });
}

// ── Subscriptions ─────────────────────────────────────────────────────────────

export function subscribeToConsultation(
  consultationId: string,
  callback: (c: FirestoreConsultation | null) => void,
): () => void {
  return onSnapshot(doc(db, COLL, consultationId), (snap) => {
    callback(snap.exists() ? (snap.data() as FirestoreConsultation) : null);
  });
}

export function subscribeToPatientConsultations(
  patientId: string,
  callback: (list: FirestoreConsultation[]) => void,
): () => void {
  const q = query(collection(db, COLL), where('patientId', '==', patientId));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => d.data() as FirestoreConsultation);
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    callback(list);
  });
}

// Doctors see two streams merged:
//   • All 'pending' consultations (any doctor can accept)
//   • Their own accepted/completed consultations (where doctorId == uid)
export function subscribeToDoctorConsultations(
  doctorId: string,
  onUpdate: (pending: FirestoreConsultation[], mine: FirestoreConsultation[]) => void,
): () => void {
  let pendingList: FirestoreConsultation[] = [];
  let mineList: FirestoreConsultation[] = [];

  const unsubPending = onSnapshot(
    query(collection(db, COLL), where('status', '==', 'pending')),
    snap => {
      pendingList = snap.docs.map(d => d.data() as FirestoreConsultation);
      onUpdate(pendingList, mineList);
    },
  );

  const unsubMine = onSnapshot(
    query(collection(db, COLL), where('doctorId', '==', doctorId)),
    snap => {
      mineList = snap.docs.map(d => d.data() as FirestoreConsultation);
      onUpdate(pendingList, mineList);
    },
  );

  return () => { unsubPending(); unsubMine(); };
}

// ── Push notification token store ─────────────────────────────────────────────

export async function savePushToken(uid: string, token: string): Promise<void> {
  await setDoc(doc(db, 'pushTokens', uid), {
    token,
    updatedAt: new Date().toISOString(),
  });
}

export async function getPushToken(uid: string): Promise<string | null> {
  const snap = await getDoc(doc(db, 'pushTokens', uid));
  return snap.exists() ? ((snap.data().token as string) ?? null) : null;
}

// Cross-device push via Expo push service (no backend required for development).
// Token must have been registered by calling registerPushTokenIfNeeded on the target device.
export async function sendPushNotificationToUser(
  uid: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  const token = await getPushToken(uid);
  if (!token) return;
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ to: token, title, body, data: data ?? {}, sound: 'default' }),
    });
  } catch {
    // Non-critical: patient will see the update via Firestore real-time subscription
  }
}
