import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';

// Default configuration or fallback
let firebaseConfig: any = null;

try {
  // Dynamically import config if created by set_up_firebase
  const importedConfig = (window as any).__FIREBASE_CONFIG__;
  if (importedConfig) {
    firebaseConfig = importedConfig;
  }
} catch (e) {
  // Use default
}

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.warn("Firebase initialization notice:", error);
}

export { app, auth, db };

export async function loginWithGoogle() {
  if (!auth) throw new Error("Firebase Auth is initializing.");
  const provider = new GoogleAuthProvider();
  return await signInWithPopup(auth, provider);
}

export async function logoutUser() {
  if (auth) {
    await signOut(auth);
  }
}

// Helper to handle Firestore errors in accordance with skill rules
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}
