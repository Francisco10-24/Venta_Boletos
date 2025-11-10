import { db } from './firebase-config.js';
import { collection, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

let conciertoActual = null;

// Cargar conciertos disponibles
async function cargarConciertos() {
    try {
        const querySnapshot = await getDocs(collection(db, 'conciertos'));
        const container = document.getElementById('conciertosDisponibles');
        
        if (querySnapshot.empty) {
            container.innerHTML = '<div class="col-12 text-center"><p class="text-muted">No hay conciertos disponibles en este momento.</p></div>';
            return;
        }

        let html = '';
        querySnapshot.forEach((doc) => {
            const concierto = doc.data();
            html += `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card h-100 concert-card">
                        <div class="card-body">
                            <h5 class="card-title">${concierto.artista}</h5>
                            <p class="card-text"><strong>Fecha:</strong> ${concierto.fecha || 'Por definir'}</p>
                            <p class="card-text"><strong>Lugar:</strong> ${concierto.lugar || 'Por definir'}</p>
                            <p class="card-text"><strong>Precio:</strong> $${concierto.precio || 0}</p>
                            <button class="btn btn-primary w-100" onclick="seleccionarConcierto('${doc.id}', ${JSON.stringify(concierto).replace(/'/g, "&#39;")})">
                                Seleccionar
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;

    } catch (error) {
        console.error('Error cargando conciertos:', error);
    }
}

// Seleccionar concierto
window.seleccionarConcierto = function(conciertoId, concierto) {
    conciertoActual = { id: conciertoId, ...concierto };
    
    document.getElementById('conciertoSeleccionado').value = concierto.artista;
    document.getElementById('formularioCompra').classList.remove('d-none');
    
    calcularTotal();
    
    // Scroll al formulario
    document.getElementById('formularioCompra').scrollIntoView({ behavior: 'smooth' });
};

// Calcular total
function calcularTotal() {
    if (!conciertoActual) return;
    
    const cantidad = parseInt(document.getElementById('cantidadBoletos').value);
    const precioUnitario = conciertoActual.precio || 0;
    const total = cantidad * precioUnitario;
    
    document.getElementById('precioTotal').value = `$${total}`;
    document.getElementById('totalCompra').textContent = `$${total}`;
}

// Event listeners
document.getElementById('cantidadBoletos').addEventListener('change', calcularTotal);

// Procesar compra
document.getElementById('formCompra').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!conciertoActual) {
        alert('Por favor selecciona un concierto primero');
        return;
    }

    const cantidad = parseInt(document.getElementById('cantidadBoletos').value);
    const email = document.getElementById('emailCliente').value;
    const total = cantidad * (conciertoActual.precio || 0);

    try {
        // Registrar la venta
        await addDoc(collection(db, 'ventas'), {
            conciertoId: conciertoActual.id,
            conciertoNombre: conciertoActual.artista,
            clienteEmail: email,
            cantidad: cantidad,
            total: total,
            fechaVenta: serverTimestamp(),
            estado: 'completada',
            metodoPago: 'tarjeta_simulada',
            tipo: 'cliente'
        });

        // Mostrar confirmación
        alert(`✅ ¡Compra exitosa!\n\nHas comprado ${cantidad} boleto(s) para ${conciertoActual.artista}\nTotal: $${total}\n\nSe ha enviado la confirmación a: ${email}`);
        
        // Limpiar formulario
        document.getElementById('formCompra').reset();
        document.getElementById('formularioCompra').classList.add('d-none');
        conciertoActual = null;

    } catch (error) {
        console.error('Error procesando compra:', error);
        alert('❌ Error al procesar la compra. Por favor intenta nuevamente.');
    }
});

// Formateadores de tarjeta
document.getElementById('numeroTarjeta').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let matches = value.match(/\d{4,16}/g);
    let match = matches && matches[0] || '';
    let parts = [];
    
    for (let i = 0; i < match.length; i += 4) {
        parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
        e.target.value = parts.join(' ');
    } else {
        e.target.value = value;
    }
});

document.getElementById('fechaExpiracion').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
        e.target.value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
});

document.getElementById('cvv').addEventListener('input', function(e) {
    e.target.value = e.target.value.replace(/\D/g, '').substring(0, 3);
});

// Inicializar
cargarConciertos();