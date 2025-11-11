import { auth } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

// Verificar autenticación global
export function verificarAutenticacion() {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, (user) => {
            resolve(user);
        });
    });
}

// Función de logout
export function logout() {
    return signOut(auth);
}

// Verificar si el usuario está autenticado y redirigir si no
export async function requireAuth() {
    const user = await verificarAutenticacion();
    if (!user) {
        window.location.href = 'adminLogin.html';
        return null;
    }
    return user;
}