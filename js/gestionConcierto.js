import { auth, db, getCurrentUser } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { collection, getDocs, addDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

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

// Cargar conciertos
async function cargarConciertos() {
    try {
        const querySnapshot = await getDocs(collection(db, 'conciertos'));
        const lista = document.getElementById('listaConciertos');

        if (querySnapshot.empty) {
            lista.innerHTML = '<p class="text-muted">No hay conciertos registrados.</p>';
            return;
        }

        let html = '<div class="row">';
        querySnapshot.forEach((doc) => {
            const concierto = doc.data();
            html += `
                <div class="col-md-6 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${concierto.artista}</h5>
                            <p class="card-text"><strong>Fecha:</strong> ${concierto.fecha}</p>
                            <p class="card-text"><strong>Lugar:</strong> ${concierto.lugar}</p>
                            <p class="card-text"><strong>Precio:</strong> $${concierto.precio}</p>
                            <button class="btn btn-danger btn-sm" onclick="eliminarConcierto('${doc.id}')">Eliminar</button>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        lista.innerHTML = html;

    } catch (error) {
        console.error('Error cargando conciertos:', error);
    }
}

// Guardar nuevo concierto
window.guardarConcierto = async function () {
    const artista = document.getElementById('artista').value;
    const fecha = document.getElementById('fecha').value;
    const lugar = document.getElementById('lugar').value;
    const precio = document.getElementById('precio').value;

    try {
        await addDoc(collection(db, 'conciertos'), {
            artista: artista,
            fecha: fecha,
            lugar: lugar,
            precio: parseFloat(precio),
            estado: 'activo',
            fechaCreacion: new Date()
        });

        // Cerrar modal y recargar
        bootstrap.Modal.getInstance(document.getElementById('nuevoConciertoModal')).hide();
        cargarConciertos();

        // Limpiar formulario
        document.getElementById('formNuevoConcierto').reset();

    } catch (error) {
        console.error('Error guardando concierto:', error);
        alert('Error al guardar el concierto');
    }
};

// Eliminar concierto
window.eliminarConcierto = async function (conciertoId) {
    if (confirm('¿Estás seguro de eliminar este concierto?')) {
        try {
            await deleteDoc(doc(db, 'conciertos', conciertoId));
            cargarConciertos();
        } catch (error) {
            console.error('Error eliminando concierto:', error);
        }
    }
};

// Función de logout 
window.logout = function () {
    signOut(auth).then(() => {
        console.log('Sesión cerrada exitosamente');
        window.location.href = 'login.html';
    }).catch((error) => {
        console.error('Error al cerrar sesión:', error);
        // Forzar redirección incluso si hay error
        window.location.href = 'login.html';
    });
};