import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { collection, getDocs, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

// Verificar autenticación
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('userEmail').textContent = user.email;
        cargarUsuarios();
    } else {
        window.location.href = 'adminLogin.html';
    }
});

// Cargar usuarios
async function cargarUsuarios() {
    try {
        const querySnapshot = await getDocs(collection(db, 'usuarios'));
        const tabla = document.getElementById('tablaUsuarios');
        
        let html = '';
        let total = 0, admins = 0, empleados = 0, clientes = 0;

        if (querySnapshot.empty) {
            html = '<tr><td colspan="4" class="text-center text-muted">No hay usuarios registrados</td></tr>';
        } else {
            querySnapshot.forEach((doc) => {
                const usuario = doc.data();
                total++;
                
                // Contar por tipo
                if (usuario.tipo === 'admin') admins++;
                else if (usuario.tipo === 'empleado') empleados++;
                else if (usuario.tipo === 'cliente') clientes++;

                const fecha = usuario.fechaRegistro?.toDate?.() || new Date();
                
                html += `
                    <tr>
                        <td>${usuario.email}</td>
                        <td>
                            <span class="badge ${getBadgeClass(usuario.tipo)}">
                                ${usuario.tipo}
                            </span>
                        </td>
                        <td>${fecha.toLocaleDateString()}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-warning me-1" onclick="editarUsuario('${doc.id}')">
                                ✏️ Editar
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="eliminarUsuario('${doc.id}')">
                                🗑️ Eliminar
                            </button>
                        </td>
                    </tr>
                `;
            });
        }

        tabla.innerHTML = html;
        
        // Actualizar estadísticas
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

// Crear usuario
window.crearUsuario = async function() {
    const email = document.getElementById('emailUsuario').value;
    const password = document.getElementById('passwordUsuario').value;
    const tipo = document.getElementById('tipoUsuario').value;
    const nombre = document.getElementById('nombreUsuario').value;

    try {
        // Crear usuario en Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Guardar datos adicionales en Firestore
        await setDoc(doc(db, 'usuarios', user.uid), {
            email: email,
            tipo: tipo,
            nombre: nombre || '',
            fechaRegistro: serverTimestamp()
        });

        // Cerrar modal y recargar
        bootstrap.Modal.getInstance(document.getElementById('nuevoUsuarioModal')).hide();
        document.getElementById('formNuevoUsuario').reset();
        cargarUsuarios();

        alert('✅ Usuario creado exitosamente');

    } catch (error) {
        console.error('Error creando usuario:', error);
        alert(' Error al crear usuario: ' + error.message);
    }
};

// Funciones placeholder para editar y eliminar
window.editarUsuario = function(usuarioId) {
    alert('Funcionalidad de edición en desarrollo para: ' + usuarioId);
};

window.eliminarUsuario = function(usuarioId) {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
        alert('Funcionalidad de eliminación en desarrollo para: ' + usuarioId);
    }
};

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