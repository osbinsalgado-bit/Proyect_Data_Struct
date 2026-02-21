// Importamos las funciones necesarias del SDK de Firebase
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Configuración de Firebase usando variables de entorno seguras (Vite)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Inicializamos la aplicación de Firebase
const app = initializeApp(firebaseConfig);

// Inicializamos los servicios que vamos a utilizar en nuestro SaaS
const auth = getAuth(app);        // Para el Login / Validar Dominios
const db = getFirestore(app);     // La Base de Datos (Laboratorios, PCs, Instituciones)
const storage = getStorage(app);  // Para guardar los Logos de las Instituciones

export { auth, db, storage };