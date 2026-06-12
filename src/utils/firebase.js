import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Primary Firebase Project Config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Primary Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Secondary Firebase Project Config
const firebaseConfig2 = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY_2 || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN_2 || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID_2 || import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET_2 || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID_2 || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID_2 || import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Secondary Firebase
const app2 = initializeApp(firebaseConfig2, "app2");
export const auth2 = getAuth(app2);

export const signInWithGoogle = (projectNum = 1, emailHint = "") => {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/gmail.send');
  if (emailHint) {
    provider.setCustomParameters({ login_hint: emailHint });
  }
  const targetAuth = projectNum === 2 ? auth2 : auth;
  return signInWithPopup(targetAuth, provider);
};
