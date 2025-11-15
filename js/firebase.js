// Configuración de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { getFirestore, doc, setDoc, addDoc, getDoc, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

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

//Función para registrar un nuevo usuario
export async function registerUser(email, password, nombre) {
    try {
        console.log('Iniciando registro para:', email);

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Crear documento en Firestore (usuarios)
        await setDoc(doc(db, "usuarios", user.uid), {
            email,
            nombre,
            tipo: "cliente"
        });

        console.log("Usuario registrado en Firestore exitosamente");
        return true;

    } catch (error) {
        console.error("Error registrando usuario:", error);
        return false;
    }
};

export async function loginUser(email, password) {
    try {

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const dataUser = await getDoc(doc(db, "usuarios", user.uid));

        if (dataUser.exists()) {
            console.log("Usuario logueado exitosamente: ", dataUser.data().tipo);
            return dataUser.data();
        } else {
            throw new Error("El usuario no existe")
        }

    } catch (error) {
        console.log("Error al loguear usuario: ", error);
        return null;
    }
};

//Obtener el usuario logueado actual
export async function getCurrentUser() {
    try {
        const user = auth.currentUser;
        console.log('Usuario de auth:', user ? user.uid : 'No user');

        if (user) {
            const userDoc = await getDoc(doc(db, "usuarios", user.uid));
            console.log('Documento de usuario existe:', userDoc.exists());

            if (userDoc.exists()) {
                const userData = { ...userDoc.data(), uid: user.uid };
                console.log('Datos del usuario:', userData);
                return userData;
            } else {
                console.log('No se encontró documento del usuario en Firestore');
                return basicUserData;
            }
        }
        return null;
    } catch (error) {
        console.error('Error en getCurrentUser:', error);
        return null;
    }
};

export async function createUserAsAdmin(email, password, nombre, tipo) {
    try {
        console.log('Creando usuario como admin:', email);

        // Simplemente crear el usuario - aceptamos que la sesión cambiará
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;

        // Guardar en Firestore
        await setDoc(doc(db, "usuarios", newUser.uid), {
            email,
            nombre: nombre || '',
            tipo: tipo,
            fechaRegistro: serverTimestamp()
        });

        console.log("Usuario creado exitosamente en Firestore");
        return { success: true, userId: newUser.uid };

    } catch (error) {
        console.error("Error creando usuario:", error);
        return { success: false, error: error.message };
    }
};