export function firebaseErrorMessage(code: string): string {
  switch (code) {
    // Auth credential errors
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled. Please enable it in the Firebase Console under Authentication → Sign-in method.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorised in Firebase. Add it under Firebase Console → Authentication → Settings → Authorised domains.';

    // Config / setup errors
    case 'auth/invalid-api-key':
    // Firebase sometimes returns the full description as the code
    case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
      return 'Firebase API key is invalid. Please fill in your real Firebase config in lib/firebase.ts.';
    case 'auth/app-not-authorized':
    case 'auth/configuration-not-found':
      return 'Firebase Authentication is not configured. Check your Firebase project settings.';
    case 'auth/internal-error':
      return 'Firebase internal error. Please check your Firebase config and try again.';

    default:
      return 'Something went wrong. Please try again.';
  }
}
