import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

// Verificar autenticación
onAuthStateChanged(auth, async (user) => {
    if (user) {
        document.getElementById('userEmail').textContent = user.email;
        await cargarEstadisticas();
        await cargarConciertos();
    } else {
        window.location.href = 'adminLogin.html';
    }
});

// Cargar estadísticas
async function cargarEstadisticas() {
    try {
        // Contar conciertos
        const conciertosSnapshot = await getDocs(collection(db, 'conciertos'));
        document.getElementById('totalConciertos').textContent = conciertosSnapshot.size;
        
        // Contar usuarios
        const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));
        document.getElementById('totalUsuarios').textContent = usuariosSnapshot.size;
        
        // Calcular ventas e ingresos
        const ventasSnapshot = await getDocs(collection(db, 'ventas'));
        let totalVentas = 0;
        let ingresosTotales = 0;
        
        ventasSnapshot.forEach((doc) => {
            const venta = doc.data();
            totalVentas++;
            ingresosTotales += venta.total || 0;
        });
        
        document.getElementById('totalVentas').textContent = totalVentas;
        document.getElementById('ingresos').textContent = `$${ingresosTotales}`;
        
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

// Cargar conciertos
async function cargarConciertos() {
    try {
        const querySnapshot = await getDocs(collection(db, 'conciertos'));
        const conciertosList = document.getElementById('conciertosList');
        
        if (querySnapshot.empty) {
            conciertosList.innerHTML = '<p class="text-muted">No hay conciertos registrados aún.</p>';
            return;
        }
        
        let html = '<div class="row">';
        querySnapshot.forEach((doc) => {
            const concierto = doc.data();
            html += `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card h-100">
                        <div class="card-body">
                            <h6 class="card-title">${concierto.artista}</h6>
                            <p class="card-text small text-muted">
                                ${concierto.fecha || 'Fecha no definida'}
                            </p>
                            <p class="card-text small">${concierto.lugar || 'Lugar no definido'}</p>
                            <p class="card-text small"><strong>Precio:</strong> $${concierto.precio || 0}</p>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        conciertosList.innerHTML = html;
        
    } catch (error) {
        console.error('Error cargando conciertos:', error);
        document.getElementById('conciertosList').innerHTML = '<p class="text-danger">Error cargando conciertos</p>';
    }
}

// Función de logout 
window.logout = function() {
    signOut(auth).then(() => {
        console.log('✅ Sesión cerrada exitosamente');
        window.location.href = 'adminLogin.html';
    }).catch((error) => {
        console.error(' Error al cerrar sesión:', error);
        // Forzar redirección incluso si hay error
        window.location.href = 'adminLogin.html';
    });
};