import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

// Verificar autenticación
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('userEmail').textContent = user.email;
        cargarVentas();
    } else {
        window.location.href = 'adminLogin.html';
    }
});

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

// Simular venta
window.simularVenta = async function() {
    try {
        console.log('Iniciando simulación de venta...');
        
        const conciertosSnapshot = await getDocs(collection(db, 'conciertos'));
        console.log('Conciertos encontrados:', conciertosSnapshot.size);
        
        if (conciertosSnapshot.empty) {
            alert('❌ Primero crea algunos conciertos para simular ventas');
            return;
        }

        const primerConciertoDoc = conciertosSnapshot.docs[0];
        const primerConcierto = primerConciertoDoc.data();
        const conciertoId = primerConciertoDoc.id;

        const cantidad = Math.floor(Math.random() * 4) + 1;
        const precioUnitario = parseFloat(primerConcierto.precio) || 50;
        const total = cantidad * precioUnitario;

        await addDoc(collection(db, 'ventas'), {
            conciertoId: conciertoId,
            conciertoNombre: primerConcierto.artista || 'Concierto Demo',
            clienteEmail: 'cliente@ejemplo.com',
            cantidad: cantidad,
            total: total,
            fechaVenta: serverTimestamp(),
            estado: 'completada',
            metodoPago: 'tarjeta_simulada',
            tipo: 'simulada'
        });

        alert('✅ Venta simulada exitosamente');
        cargarVentas();

    } catch (error) {
        console.error('Error simulando venta:', error);
        alert('Error al simular venta: ' + error.message);
    }
};

// Generar reporte
window.generarReporte = function() {
    alert('📊 Generando reporte de ventas... (Funcionalidad en desarrollo)');
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