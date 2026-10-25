// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';

import { getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDCEQJ94jOKpQfR1lW3Htsvq8wsMImcf3E',
  authDomain: 'chat--community.firebaseapp.com',
  projectId: 'chat--community',
  storageBucket: 'chat--community.firebasestorage.app',
  messagingSenderId: '46961080824',
  appId: '1:46961080824:web:0976d1e36e347f763d3e0d',
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
