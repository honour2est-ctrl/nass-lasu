import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, Auth } from 'firebase/auth';
import config from '../firebase-applet-config.json';

const firebaseConfig = (config as any).default || config;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/forms.body');
provider.addScope('https://www.googleapis.com/auth/forms.responses.readonly');

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch (e) {
  console.error("Firebase init error:", e);
}

const getFirebaseAuth = () => {
  if (!auth && app) {
    try {
      auth = getAuth(app);
    } catch (e) {
      console.error("Firebase auth init error:", e);
    }
  }
  return auth;
};

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  const currentAuth = getFirebaseAuth();
  if (!currentAuth) {
    if (onAuthFailure) onAuthFailure();
    return () => {};
  }
  try {
    return onAuthStateChanged(currentAuth, async (user: User | null) => {
      if (user) {
        if (cachedAccessToken) {
          if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
        } else if (!isSigningIn) {
          cachedAccessToken = null;
          if (onAuthFailure) onAuthFailure();
        }
      } else {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    }, (error) => {
      console.warn("Auth state error:", error);
      if (onAuthFailure) onAuthFailure();
    });
  } catch (e) {
    console.warn("Failed to subscribe to auth state:", e);
    if (onAuthFailure) onAuthFailure();
    return () => {};
  }
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  const currentAuth = getFirebaseAuth();
  if (!currentAuth) throw new Error("Auth not initialized");

  try {
    isSigningIn = true;
    const result = await signInWithPopup(currentAuth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    if (error?.code === 'auth/configuration-not-found' || error?.message?.includes('configuration-not-found')) {
      throw new Error('Firebase Authentication is not enabled for project "nass-lasu-website" in the Firebase Console. Please enable Authentication in Firebase Console -> Authentication -> Get Started.');
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  const currentAuth = getFirebaseAuth();
  if (currentAuth) {
    await currentAuth.signOut();
  }
  cachedAccessToken = null;
};
