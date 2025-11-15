import { auth, db, getCurrentUser } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

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
            await cargarVentas();

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
// Cargar ventas
async function cargarVentas() {
    try {
        const q = query(collection(db, 'ventas'), orderBy('fechaVenta', 'desc'));
        const querySnapshot = await getDocs(q);
        const tabla = document.getElementById('tablaVentas');

        let html = '';
        let totalVentas = 0;
        let ingresosTotales = 0;
        let ventasHoy = 0;
        const hoy = new Date().toDateString();

        if (querySnapshot.empty) {
            html = '<tr><td colspan="7" class="text-center text-muted">No hay ventas registradas</td></tr>';
        } else {
            querySnapshot.forEach((doc) => {
                const venta = doc.data();
                totalVentas++;
                ingresosTotales += venta.total || 0;

                const fechaVenta = venta.fechaVenta?.toDate?.() || new Date();
                if (fechaVenta.toDateString() === hoy) {
                    ventasHoy++;
                }

                html += `
                    <tr>
                        <td><small>${doc.id.substring(0, 8)}...</small></td>
                        <td>${venta.conciertoNombre || 'Concierto'}</td>
                        <td>${venta.clienteEmail || 'Cliente'}</td>
                        <td>${venta.cantidad || 1}</td>
                        <td>$${venta.total || 0}</td>
                        <td>${fechaVenta.toLocaleDateString()}</td>
                        <td><span class="badge bg-success">Completada</span></td>
                    </tr>
                `;
            });
        }

        tabla.innerHTML = html;

        // Actualizar estadísticas
        document.getElementById('totalVentas').textContent = totalVentas;
        document.getElementById('ingresosTotales').textContent = `$${ingresosTotales}`;
        document.getElementById('ventasHoy').textContent = ventasHoy;

    } catch (error) {
        console.error('Error cargando ventas:', error);
    }
}

// Función de logout 
window.logout = function () {
    signOut(auth).then(() => {
        console.log('✅ Sesión cerrada exitosamente');
        window.location.href = 'login.html';
    }).catch((error) => {
        console.error(' Error al cerrar sesión:', error);
        // Forzar redirección incluso si hay error
        window.location.href = 'login.html';
    });
};