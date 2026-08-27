import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const dbId = firebaseConfig.firestoreDatabaseId;

// Initialize Firestore with robust connection settings for iframe and cloud sandboxes
export const db = (() => {
  try {
    if (dbId) {
      return initializeFirestore(
        app,
        {
          experimentalAutoDetectLongPolling: true,
        },
        dbId
      );
    }
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    });
  } catch {
    // Fallback if already initialized
    return dbId ? getFirestore(app, dbId) : getFirestore(app);
  }
})();

export { app };

