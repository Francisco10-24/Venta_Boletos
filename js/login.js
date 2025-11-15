import { loginUser } from './firebase.js';

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    let email = document.getElementById('email').value;
    let password = document.getElementById('password').value;
    let messageDiv = document.getElementById('loginMessage');

    try {
        const userData = await loginUser(email, password);

        if (userData) {
            if (userData.tipo === "admin" || userData.tipo === "empleado") {
                messageDiv.className = 'alert alert-success mt-3';
                messageDiv.textContent = "Usuario logueado exitosamente";
                messageDiv.classList.remove('d-none');
                window.location.href = 'admin-dashboard.html';
            }
            else if (userData.tipo === "cliente") {
                messageDiv.className = 'alert alert-success mt-3';
                messageDiv.textContent = "Usuario logueado exitosamente";
                messageDiv.classList.remove('d-none');
                window.location.href = 'compra-cliente.html';
            } else {
                messageDiv.className = 'alert alert-danger mt-3';
                messageDiv.textContent = "Usuario no encontrado";
                messageDiv.classList.remove('d-none');
            }
        }

    } catch (error) {
        messageDiv.className = 'alert alert-danger mt-3';
        messageDiv.textContent = "Error al loguear usuario";
        messageDiv.classList.remove('d-none');
    }

});