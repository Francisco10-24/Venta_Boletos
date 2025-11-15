import { db, auth, getCurrentUser } from './firebase.js';
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { collection, getDocs, addDoc, serverTimestamp, doc, getDoc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

let conciertoActual = null;
let currentUser = null;

// Función para crear o obtener usuario
async function obtenerUsuario(user) {
    try {
        console.log('Obteniendo datos del usuario...');
        let userData = await getCurrentUser();

        return userData;
    } catch (error) {
        console.error('Error en obtenerOcrearUsuario:', error);
        // Retornar datos básicos incluso si hay error
        return {
            uid: user.uid,
            email: user.email,
            nombre: user.email.split('@')[0],
            tipo: 'cliente'
        };
    }
}

// Verificar autenticación
onAuthStateChanged(auth, async (user) => {

    if (user) {
        try {
            currentUser = await obtenerUsuario(user);

            if (currentUser) {
                document.getElementById('userEmail').textContent = user.email;

                // Prellenar email si el usuario está logueado
                document.getElementById('emailCliente').value = user.email;
                document.getElementById('nombreCliente').value = currentUser.nombre || '';

                console.log('✅ Usuario autenticado como:', currentUser.tipo);

                // Verificar que sea cliente
                if (currentUser.tipo !== 'cliente') {
                    console.log('❌ Usuario no es cliente, redirigiendo...');
                    alert('Esta sección es solo para clientes');
                    window.location.href = '../index.html';
                    return;
                }

                // Cargar conciertos solo si es cliente
                await cargarConciertos();
            } else {
                console.log('No se pudieron obtener datos del usuario');
                alert('Error al cargar datos del usuario. Por favor recarga la página.');
            }
        } catch (error) {
            console.error('Error en onAuthStateChanged:', error);
            // Crear usuario básico incluso con error
            currentUser = {
                uid: user.uid,
                email: user.email,
                nombre: user.email.split('@')[0],
                tipo: 'cliente'
            };
            console.log('🔄 Usuario de respuesto creado:', currentUser);

            document.getElementById('userEmail').textContent = user.email;
            document.getElementById('emailCliente').value = user.email;
            document.getElementById('nombreCliente').value = currentUser.nombre;

            await cargarConciertos();
        }
    } else {
        alert('Debes iniciar sesión para acceder a esta página');
        window.location.href = 'login.html';
    }
});

// El resto del código permanece igual...
async function cargarConciertos() {
    try {
        console.log('Cargando conciertos...');
        const querySnapshot = await getDocs(collection(db, 'conciertos'));
        const container = document.getElementById('conciertosDisponibles');

        if (querySnapshot.empty) {
            container.innerHTML = '<div class="col-12 text-center"><p class="text-muted">No hay conciertos disponibles en este momento.</p></div>';
            return;
        }

        let html = '';
        let conciertoCount = 0;

        querySnapshot.forEach((doc) => {
            const concierto = doc.data();
            const conciertoId = doc.id;

            if (concierto.activo !== false) {
                const fecha = concierto.fecha ? new Date(concierto.fecha).toLocaleDateString('es-ES') : 'Por definir';
                const precio = concierto.precio || (concierto.localidades && concierto.localidades.general ? concierto.localidades.general.precio : 0);

                html += `
                    <div class="col-md-6 col-lg-4 mb-4">
                        <div class="card h-100 concert-card">
                            <div class="card-body">
                                <h5 class="card-title">${concierto.artista}</h5>
                                <p class="card-text"><strong>Fecha:</strong> ${fecha}</p>
                                <p class="card-text"><strong>Lugar:</strong> ${concierto.lugar || 'Por definir'}</p>
                                <p class="card-text"><strong>Precio:</strong> $${precio}</p>
                                ${concierto.descripcion ? `<p class="card-text small text-muted">${concierto.descripcion}</p>` : ''}
                                <button class="btn btn-primary w-100" onclick="seleccionarConcierto('${conciertoId}')">
                                    Seleccionar
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                conciertoCount++;
            }
        });

        if (conciertoCount === 0) {
            container.innerHTML = '<div class="col-12 text-center"><p class="text-muted">No hay conciertos disponibles en este momento.</p></div>';
        } else {
            container.innerHTML = html;
        }


    } catch (error) {
        console.error('Error cargando conciertos:', error);
        document.getElementById('conciertosDisponibles').innerHTML =
            '<div class="col-12 text-center"><p class="text-danger">Error cargando conciertos</p></div>';
    }
}

// Seleccionar concierto
window.seleccionarConcierto = async function (conciertoId) {
    try {
        console.log('Seleccionando concierto:', conciertoId);
        console.log('currentUser en seleccionarConcierto:', currentUser);

        if (!currentUser) {
            console.log('❌ currentUser es null en seleccionarConcierto');
            alert('Error de sesión. Por favor recarga la página.');
            return;
        }

        const conciertoDoc = await getDoc(doc(db, 'conciertos', conciertoId));

        if (!conciertoDoc.exists()) {
            alert('El concierto seleccionado no existe');
            return;
        }

        const concierto = conciertoDoc.data();
        conciertoActual = {
            id: conciertoId,
            ...concierto
        };

        console.log('✅ Concierto seleccionado:', conciertoActual.artista);

        document.getElementById('conciertoSeleccionado').value = concierto.artista;
        document.getElementById('formularioCompra').classList.remove('d-none');
        calcularTotal();

        document.getElementById('formularioCompra').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

    } catch (error) {
        console.error('❌ Error seleccionando concierto:', error);
        alert('Error al seleccionar el concierto');
    }
};

// El resto de las funciones permanecen igual...
function calcularTotal() {
    if (!conciertoActual) return;

    const cantidad = parseInt(document.getElementById('cantidadBoletos').value);
    const precioUnitario = conciertoActual.precio ||
        (conciertoActual.localidades && conciertoActual.localidades.general ?
            conciertoActual.localidades.general.precio : 0);
    const total = cantidad * precioUnitario;

    document.getElementById('precioTotal').value = `$${total}`;
    document.getElementById('totalCompra').textContent = `$${total}`;
}

// Configurar event listeners...
document.addEventListener('DOMContentLoaded', function () {

    const cantidadSelect = document.getElementById('cantidadBoletos');
    if (cantidadSelect) {
        cantidadSelect.addEventListener('change', calcularTotal);
    }

    const formCompra = document.getElementById('formCompra');
    if (formCompra) {
        formCompra.addEventListener('submit', function (e) {
            e.preventDefault();
            procesarCompra(e);
        });
    }
});

// Procesar compra
async function procesarCompra(e) {
    console.log('💳 Iniciando procesamiento de compra...');
    console.log('🔍 currentUser en procesarCompra:', currentUser);

    if (!conciertoActual) {
        alert('Por favor selecciona un concierto primero');
        return;
    }

    if (!currentUser) {
        alert('Error de sesión. Por favor recarga la página.');
        return;
    }

    const cantidad = parseInt(document.getElementById('cantidadBoletos').value);
    const nombre = document.getElementById('nombreCliente').value;
    const email = document.getElementById('emailCliente').value;
    const precioUnitario = conciertoActual.precio ||
        (conciertoActual.localidades && conciertoActual.localidades.general ?
            conciertoActual.localidades.general.precio : 0);
    const total = cantidad * precioUnitario;

    if (!nombre || !email) {
        alert('Por favor completa todos los campos requeridos');
        return;
    }

    try {

        const ventaRef = await addDoc(collection(db, 'ventas'), {
            conciertoId: conciertoActual.id,
            conciertoNombre: conciertoActual.artista,
            clienteId: currentUser.uid,
            clienteNombre: nombre,
            clienteEmail: email,
            cantidad: cantidad,
            precioUnitario: precioUnitario,
            total: total,
            fechaVenta: serverTimestamp(),
            estado: 'completada',
            metodoPago: 'tarjeta_simulada',
            tipoUsuario: 'cliente'
        });


        alert(`¡Compra exitosa!\n\nHas comprado ${cantidad} boleto(s) para "${conciertoActual.artista}"\nTotal: $${total}\n\nNúmero de orden: ${ventaRef.id}\nSe ha enviado la confirmación a: ${email}`);

        document.getElementById('formCompra').reset();
        document.getElementById('formularioCompra').classList.add('d-none');
        conciertoActual = null;

        await cargarConciertos();

    } catch (error) {
        console.error('Error procesando compra:', error);
        alert('Error al procesar la compra. Por favor intenta nuevamente.');
    }
}

window.logout = function () {
    signOut(auth).then(() => {
        window.location.href = 'login.html';
    }).catch((error) => {
        console.error('Error al cerrar sesión:', error);
        window.location.href = 'login.html';
    });
};