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

// Maximum number of retries for Firestore initialization
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

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
  ] as const;

  const missingFields = requiredFields.filter(
    (field) => !firebaseConfig[field as keyof typeof firebaseConfig]
  );
  
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

async function initializeFirebaseApp(retryCount = 0): Promise<FirebaseApp | null> {
  try {
    console.log('Initializing Firebase with config:', {
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      // Log non-sensitive config for debugging
    });

    if (!validateFirebaseConfig()) {
      console.error('Firebase initialization skipped: Invalid config');
      return null;
    }

    if (getApps().length === 0) {
      const app = initializeApp(firebaseConfig);
      console.log('Firebase app initialized with project:', app.options.projectId);
      return app;
    } else {
      console.log('Using existing Firebase app instance');
      return getApps()[0];
    }
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying Firebase initialization (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return initializeFirebaseApp(retryCount + 1);
    }
    if (isBrowser) {
      throw error;
    }
    return null;
  }
}

async function initializeFirestoreWithRetry(app: FirebaseApp, retryCount = 0): Promise<Firestore | null> {
  try {
    const firestoreSettings: FirestoreSettings = {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    };

    console.log('Initializing Firestore...');
    const firestore = initializeFirestore(app, firestoreSettings);
    console.log('Firestore initialized with persistence enabled');
    return firestore;
  } catch (error) {
    console.error('Firestore initialization failed:', error);
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying Firestore initialization (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return initializeFirestoreWithRetry(app, retryCount + 1);
    }
    // Add more detailed error information
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    }
    return null;
  }
}

// Initialize Firebase only in browser environment
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isBrowser) {
  // Initialize Firebase app
  initializeFirebaseApp().then(firebaseApp => {
    if (firebaseApp) {
      app = firebaseApp;
      auth = getAuth(app);
      
      // Initialize Firestore
      if (!db) {
        initializeFirestoreWithRetry(app).then(firestore => {
          if (firestore) {
            db = firestore;
          }
        });
      }
    }
  }).catch(error => {
    console.error('Failed to initialize Firebase:', error);
  });
}

export { app, auth, db };
export default app; 