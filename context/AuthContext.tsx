import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { UserProfile, saveUserProfile, loadUserProfile } from '@/lib/userStorage';

type SignUpData = Omit<UserProfile, 'uid' | 'createdAt'>;

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const stored = await loadUserProfile(firebaseUser.uid);
        setProfile(stored);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const stored = await loadUserProfile(cred.user.uid);
    setProfile(stored);
  };

  const signUp = async (email: string, password: string, data: SignUpData) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const displayName = data.fullName || data.contactName || '';
    try {
      await updateProfile(cred.user, { displayName });
    } catch (e) {
      // updateProfile failure is non-critical — user is already created
      console.warn('updateProfile failed (non-critical):', e);
    }
    const fullProfile: UserProfile = {
      ...data,
      uid: cred.user.uid,
      createdAt: new Date().toISOString(),
    };
    await saveUserProfile(fullProfile);
    setProfile(fullProfile);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
