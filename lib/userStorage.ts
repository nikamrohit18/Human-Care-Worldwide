import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Language } from '@/lib/i18n';

export type AccountType = 'individual' | 'partners' | 'corporate';
export type PartnerType = 'insurance' | 'hospital' | 'corporate-hr' | 'doctor';
export type Gender = 'male' | 'female' | 'other';

export type UserProfile = {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  accountType: AccountType;
  gender?: Gender;
  dob?: string;
  // Localisation
  language?: Language;
  country?: string;
  // Partners-specific
  contactName?: string;
  orgName?: string;
  regNumber?: string;
  partnerType?: PartnerType;
  // Doctor-specific (partnerType === 'doctor')
  specialization?: string;
  // Corporate-specific
  companyName?: string;
  employeeId?: string;
  createdAt: string;
};

const profileKey = (uid: string) => `hcw_profile_${uid}`;

// Primary store is Firestore (cross-device). AsyncStorage is a local cache.
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await setDoc(doc(db, 'users', profile.uid), profile);
  try {
    await AsyncStorage.setItem(profileKey(profile.uid), JSON.stringify(profile));
  } catch { /* cache failure is non-critical */ }
}

export async function loadUserProfile(uid: string): Promise<UserProfile | null> {
  // Fast path: local cache
  let cached: UserProfile | null = null;
  try {
    const raw = await AsyncStorage.getItem(profileKey(uid));
    if (raw) cached = JSON.parse(raw) as UserProfile;
  } catch { /* ignore */ }

  if (cached) {
    // Migrate legacy AsyncStorage-only profiles to Firestore (fire-and-forget)
    migrateProfileToFirestore(cached);
    return cached;
  }

  // Slow path: Firestore (other device or first login on this device)
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      const profile = snap.data() as UserProfile;
      try {
        await AsyncStorage.setItem(profileKey(uid), JSON.stringify(profile));
      } catch { /* non-critical */ }
      return profile;
    }
  } catch { /* Firestore unavailable */ }

  return null;
}

async function migrateProfileToFirestore(profile: UserProfile): Promise<void> {
  try {
    const snap = await getDoc(doc(db, 'users', profile.uid));
    if (!snap.exists()) {
      await setDoc(doc(db, 'users', profile.uid), profile);
    }
  } catch { /* non-critical */ }
}
