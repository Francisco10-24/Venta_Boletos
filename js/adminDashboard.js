import { auth, db, getCurrentUser } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

let currentUserType = '';

// Verificar autenticación y permisos
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userData = await getCurrentUser();
        if (userData) {
            currentUserType = userData.tipo;
            document.getElementById('userEmail').textContent = user.email;

            // Aplicar permisos según el tipo de usuario
            aplicarPermisos(currentUserType);

            await cargarEstadisticas();
            await cargarConciertos();
        } else {
            window.location.href = 'login.html';
        }
    } else {
        window.location.href = 'login.html';
    }
});

// Función para aplicar permisos según el rol
function aplicarPermisos(userType) {
    const gestionUsuariosLink = document.querySelector('a[href="gestion-usuario.html"]');
    const sidebarHeader = document.querySelector('.sidebar-header small');

    if (userType === 'admin') {
        sidebarHeader.textContent = 'Panel Administrativo - Administrador';
        // Mostrar todo (ya está visible por defecto)
        if (gestionUsuariosLink) {
            gestionUsuariosLink.parentElement.style.display = 'block';
        }
    } else if (userType === 'empleado') {
        sidebarHeader.textContent = 'Panel Administrativo - Empleado';
        // Ocultar SOLO gestión de usuarios para empleados
        if (gestionUsuariosLink) {
            gestionUsuariosLink.parentElement.style.display = 'none';
        }
    } else if (userType === 'cliente') {
        // CORRECCIÓN: Los clientes van a compra-cliente.html
        window.location.href = 'compra-cliente.html';
        return;
    }
}

// El resto del código permanece igual...
async function cargarEstadisticas() {
    try {
        // Contar conciertos (todos los roles pueden ver)
        const conciertosSnapshot = await getDocs(collection(db, 'conciertos'));
        document.getElementById('totalConciertos').textContent = conciertosSnapshot.size;

        // Calcular ventas e ingresos (todos los roles pueden ver)
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

        // Contar usuarios (solo administradores pueden ver)
        if (currentUserType === 'admin') {
            const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));
            document.getElementById('totalUsuarios').textContent = usuariosSnapshot.size;
        } else {
            document.getElementById('totalUsuarios').textContent = 'N/A';
            document.querySelector('.stat-card:nth-child(3) .stat-label').textContent = 'Usuarios (Solo Admin)';
        }

    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

// Resto del código sin cambios...
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
window.logout = function () {
    signOut(auth).then(() => {
        console.log('Sesión cerrada exitosamente');
        window.location.href = 'login.html';
    }).catch((error) => {
        console.error('Error al cerrar sesión:', error);
        window.location.href = 'login.html';
    });
};