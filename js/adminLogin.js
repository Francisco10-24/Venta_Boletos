import { auth, db } from './firebase.js';
import { 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut,
    createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { 
    doc, 
    getDoc, 
    setDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

// Hacer las funciones disponibles globalmente 
window.auth = auth;
window.db = db;
window.signInWithEmailAndPassword = signInWithEmailAndPassword;
window.onAuthStateChanged = onAuthStateChanged;
window.signOut = signOut;
window.firestore = {
    doc, getDoc, setDoc, serverTimestamp
};

// Verificar autenticación 
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('Usuario logueado:', user.email);
        checkUserRole(user.uid);
    } else {
        console.log('No hay usuario logueado');
        if (window.location.pathname.includes('admin') && !window.location.pathname.includes('admin-login.html')) {
            window.location.href = 'admin-login.html';
        }
    }
});

// Función de login 
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('loginMessage');
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Login exitoso
        messageDiv.className = 'alert alert-success mt-3';
        messageDiv.textContent = '✅ Login exitoso! Redirigiendo...';
        messageDiv.classList.remove('d-none');
        
        // Redirigir al dashboard después de 1 segundo
        setTimeout(() => {
            window.location.href = 'admin-dashboard.html';
        }, 1000);
        
    } catch (error) {
        // Error en login
        messageDiv.className = 'alert alert-danger mt-3';
        messageDiv.textContent = ' Error: ' + error.message;
        messageDiv.classList.remove('d-none');
    }
});

// Verificar rol de usuario 
async function checkUserRole(userId) {
    try {
        const userDocRef = doc(db, 'usuarios', userId);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('Rol del usuario:', userData.tipo);
            return userData.tipo;
        } else {
            // Si no existe en la colección usuarios, crear registro
            await setDoc(userDocRef, {
                email: auth.currentUser.email,
                tipo: 'empleado', // Por defecto
                fechaRegistro: serverTimestamp()
            });
            console.log('Nuevo usuario registrado como empleado');
            return 'empleado';
        }
    } catch (error) {
        console.error('Error verificando rol:', error);
        return 'empleado';
    }
}

// Cerrar sesión (para usar en otras páginas) 
window.logout = function() {
    signOut(auth).then(() => {
        window.location.href = 'admin-login.html';
    });
};


