import AsyncStorage from '@react-native-async-storage/async-storage';

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

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(profileKey(profile.uid), JSON.stringify(profile));
}

export async function loadUserProfile(uid: string): Promise<UserProfile | null> {
  const raw = await AsyncStorage.getItem(profileKey(uid));
  return raw ? (JSON.parse(raw) as UserProfile) : null;
}
