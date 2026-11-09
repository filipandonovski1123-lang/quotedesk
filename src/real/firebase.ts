import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

// Public web config: safe to ship. Access is controlled by firestore.rules, not by hiding these.
const config = {
  apiKey: 'AIzaSyDmx_MHQz2V7sGdyvhSOAcT2MGaAAdhFL4',
  authDomain: 'quotedesk-4506.firebaseapp.com',
  projectId: 'quotedesk-4506',
  appId: '1:548121353440:web:a7b5046e428df5ef188485',
  messagingSenderId: '548121353440',
};

export const app = initializeApp(config);
export const auth = getAuth(app);
// Optional fields are left out rather than stored as undefined (which Firestore rejects).
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
