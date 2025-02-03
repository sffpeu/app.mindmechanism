import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { 
  getFirestore, 
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator,
  initializeFirestore,
  type FirestoreSettings,
  enableIndexedDbPersistence,
  type Firestore
} from 'firebase/firestore';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Debug: Log Firebase config (without sensitive values)
const debugConfig = {
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID 
    ? `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`
    : undefined,
};

// Validate Firebase config
const validateFirebaseConfig = () => {
  const requiredFields = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];

  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
  
  if (missingFields.length > 0) {
    console.error('Missing Firebase configuration fields:', missingFields);
    if (isBrowser) {
      // In browser, show a user-friendly message
      throw new Error('Firebase configuration is incomplete. Please check your environment variables.');
    } else {
      // During build, log the error but don't throw
      console.warn('Firebase configuration incomplete during build. This is expected.');
      return false;
    }
  }
  return true;
};

function initializeFirebaseApp(): FirebaseApp | null {
  try {
    console.log('Initializing Firebase...');
    if (!validateFirebaseConfig()) {
      console.warn('Skipping Firebase initialization due to incomplete config');
      return null;
    }

    if (getApps().length === 0) {
      const app = initializeApp(firebaseConfig);
      console.log('Firebase app initialized successfully');
      return app;
    } else {
      console.log('Firebase app already initialized');
      return getApps()[0];
    }
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    if (isBrowser) {
      throw error;
    }
    return null;
  }
}

// Initialize Firebase only in browser environment
const app: FirebaseApp | null = isBrowser ? initializeFirebaseApp() : null;
const auth: Auth | null = app ? getAuth(app) : null;
let db: Firestore | null = null;

if (isBrowser && app) {
  try {
    // Initialize Firestore with modern persistence settings
    const firestoreSettings: FirestoreSettings = {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    };

    db = initializeFirestore(app, firestoreSettings);

    // Enable offline persistence
    console.log('Initializing Firestore...');
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
      } else if (err.code === 'unimplemented') {
        console.warn('The current browser does not support persistence.');
      }
    });

    console.log('Firestore initialized successfully');
  } catch (error) {
    console.error('Error in Firebase initialization:', error);
    // Don't throw here to prevent app from crashing
  }
}

export { app, auth, db };
export default app; 