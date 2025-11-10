// Configuración de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBPKrfa3HPYR1Ta-ESxd9yzios2OjtWQOc",
    authDomain: "nextlab-concerts.firebaseapp.com",
    projectId: "nextlab-concerts",
    storageBucket: "nextlab-concerts.firebasestorage.app",
    messagingSenderId: "600104084693",
    appId: "1:600104084693:web:b57af7980650b1b1f6ae5c",
    measurementId: "G-27TQDS65G3"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Exportar para usar en otros archivos
export { app, auth, db };