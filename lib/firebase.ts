import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator,
  FirestoreSettings
} from 'firebase/firestore';

// Debug: Log Firebase config (without sensitive values)
const debugConfig = {
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};
console.log('Firebase Config:', debugConfig);

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

console.log('Initializing Firebase...');
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

console.log('Initializing Firestore...');
// Initialize Firestore with modern persistence settings
const firestoreSettings: FirestoreSettings = {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
};

export const db = getFirestore(app);
db.settings(firestoreSettings);

console.log('Firebase initialization complete');
export default app; 