import { auth, db, getCurrentUser, createUserAsAdmin } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

let currentAdminUser = null;
let usuariosData = [];
let adminAuth = null;

onAuthStateChanged(auth, async (user) => {
    console.log('Auth state changed:', user ? user.email : 'No user');

    if (user) {
        const userData = await getCurrentUser();
        if (userData) {
            // Solo administradores pueden acceder a gestión de usuarios
            if (userData.tipo !== 'admin') {
                alert('No tienes permisos para acceder a esta sección');
                window.location.href = 'admin-dashboard.html';
                return;
            }

            currentAdminUser = user;
            adminAuth = auth; // Guardar la instancia de auth

            document.getElementById('userEmail').textContent = user.email;
            await cargarUsuarios();

        } else {
            window.location.href = 'login.html';
        }
    } else {
        window.location.href = 'login.html';
    }
});

// Cargar usuarios
async function cargarUsuarios() {
    try {
        const querySnapshot = await getDocs(collection(db, 'usuarios'));
        const tabla = document.getElementById('tablaUsuarios');

        usuariosData = [];
        let html = '';
        let total = 0, admins = 0, empleados = 0, clientes = 0;

        if (querySnapshot.empty) {
            html = '<tr><td colspan="5" class="text-center text-muted">No hay usuarios registrados</td></tr>';
        } else {
            querySnapshot.forEach((doc) => {
                const usuario = { id: doc.id, ...doc.data() };
                usuariosData.push(usuario);
                total++;

                if (usuario.tipo === 'admin') admins++;
                else if (usuario.tipo === 'empleado') empleados++;
                else if (usuario.tipo === 'cliente') clientes++;

                const fecha = usuario.fechaRegistro?.toDate?.() || new Date();
                const esUsuarioActual = usuario.id === currentAdminUser?.uid;

                html += `
                    <tr>
                        <td>${usuario.email}</td>
                        <td>${usuario.nombre || 'No especificado'}</td>
                        <td>
                            <span class="badge ${getBadgeClass(usuario.tipo)}">
                                ${usuario.tipo}
                            </span>
                        </td>
                        <td>${fecha.toLocaleDateString()}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-warning me-1" onclick="editarUsuario('${doc.id}')" ${esUsuarioActual ? 'disabled' : ''}>
                                ✏️ Editar
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="eliminarUsuario('${doc.id}')" ${esUsuarioActual ? 'disabled' : ''}>
                                🗑️ Eliminar
                            </button>
                            ${esUsuarioActual ? '<span class="badge bg-info ms-1">Tú</span>' : ''}
                        </td>
                    </tr>
                `;
            });
        }

        tabla.innerHTML = html;

        document.getElementById('totalUsuarios').textContent = total;
        document.getElementById('totalAdmins').textContent = admins;
        document.getElementById('totalEmpleados').textContent = empleados;
        document.getElementById('totalClientes').textContent = clientes;

    } catch (error) {
        console.error('Error cargando usuarios:', error);
    }
}

// Clase para badges
function getBadgeClass(tipo) {
    const classes = {
        'admin': 'bg-danger',
        'empleado': 'bg-primary',
        'cliente': 'bg-success'
    };
    return classes[tipo] || 'bg-secondary';
}

window.crearUsuario = async function () {
    const email = document.getElementById('emailUsuario').value;
    const password = document.getElementById('passwordUsuario').value;
    const tipo = document.getElementById('tipoUsuario').value;
    const nombre = document.getElementById('nombreUsuario').value;

    if (!email || !password) {
        alert('Por favor completa email y contraseña');
        return;
    }

    if (password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
    }

    try {
        const modal = bootstrap.Modal.getInstance(document.getElementById('nuevoUsuarioModal'));
        if (modal) modal.hide();

        // 2. Mostrar mensaje de que la sesión cambiará
        alert(`Se creará el usuario ${email} y se cambiará la sesión. Después deberás volver a iniciar sesión como administrador.`);

        // 3. Crear el usuario (esto cambiará la sesión)
        const resultado = await createUserAsAdmin(email, password, nombre, tipo);

        if (resultado.success) {
            // 4. Mostrar confirmación y redirigir al login
            alert(`Usuario ${email} creado exitosamente.\n\nAhora inicias sesión como ${tipo}. Para volver al panel admin, cierra sesión e inicia con tu cuenta de administrador.`);

            // 5. Recargar la página para reflejar el nuevo usuario en la UI
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } else {
            throw new Error(resultado.error);
        }

    } catch (error) {
        console.error('Error creando usuario:', error);

        // Manejar errores específicos
        if (error.message.includes('email-already-in-use')) {
            alert('Error: El email ya está registrado');
        } else if (error.message.includes('weak-password')) {
            alert('Error: La contraseña es muy débil');
        } else if (error.message.includes('network-request-failed')) {
            alert('Error de conexión. Verifica tu internet.');
        } else {
            alert('Error al crear usuario: ' + error.message);
        }

        // Intentar recargar para restaurar estado
        window.location.reload();
    }
};
// Editar usuario
window.editarUsuario = async function (usuarioId) {
    const usuario = usuariosData.find(u => u.id === usuarioId);

    if (!usuario) {
        alert('Error: Usuario no encontrado');
        return;
    }

    if (usuarioId === currentAdminUser?.uid) {
        alert('No puedes editar tu propio usuario desde aquí');
        return;
    }

    document.getElementById('editEmailUsuario').value = usuario.email;
    document.getElementById('editNombreUsuario').value = usuario.nombre || '';
    document.getElementById('editTipoUsuario').value = usuario.tipo;
    document.getElementById('editUsuarioId').value = usuarioId;

    const editModal = new bootstrap.Modal(document.getElementById('editarUsuarioModal'));
    editModal.show();
};

// Cambios de edición
window.guardarEdicionUsuario = async function () {
    const usuarioId = document.getElementById('editUsuarioId').value;
    const nuevoNombre = document.getElementById('editNombreUsuario').value;
    const nuevoTipo = document.getElementById('editTipoUsuario').value;

    if (!usuarioId) {
        alert('Error: ID de usuario no válido');
        return;
    }

    try {
        await updateDoc(doc(db, 'usuarios', usuarioId), {
            nombre: nuevoNombre,
            tipo: nuevoTipo
        });

        const modal = bootstrap.Modal.getInstance(document.getElementById('editarUsuarioModal'));
        if (modal) modal.hide();

        await cargarUsuarios();
        alert('Usuario actualizado exitosamente');

    } catch (error) {
        console.error('Error actualizando usuario:', error);
        alert('Error al actualizar usuario: ' + error.message);
    }
};

// Eliminar usuario
window.eliminarUsuario = async function (usuarioId) {
    const usuario = usuariosData.find(u => u.id === usuarioId);

    if (!usuario) {
        alert('Error: Usuario no encontrado');
        return;
    }

    if (usuarioId === currentAdminUser?.uid) {
        alert('No puedes eliminar tu propio usuario');
        return;
    }

    if (confirm(`¿Estás seguro de eliminar al usuario:\n\nEmail: ${usuario.email}\nTipo: ${usuario.tipo}\n\nEsta acción no se puede deshacer.`)) {
        try {
            await deleteDoc(doc(db, 'usuarios', usuarioId));

            alert('Usuario eliminado de la base de datos.');
            await cargarUsuarios();

        } catch (error) {
            console.error('Error eliminando usuario:', error);
            alert('Error al eliminar usuario: ' + error.message);
        }
    }
};

// Función de logout
window.logout = function () {
    signOut(auth).then(() => {
        window.location.href = 'login.html';
    }).catch((error) => {
        console.error('Error al cerrar sesión:', error);
        window.location.href = 'login.html';
    });
};