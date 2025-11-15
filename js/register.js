import { registerUser } from './firebase.js';

document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    let nombre = document.getElementById('nombreUsuario').value;
    let email = document.getElementById('emailUsuario').value;
    let password = document.getElementById('passwordUsuario').value;
    let tipo = document.getElementById('tipoUsuario').value;
    const messageDiv = document.getElementById('registerMessage');

    const status = await registerUser(email, password, nombre);
    if (status) {
        messageDiv.className = 'alert alert-success mt-3';
        messageDiv.textContent = 'Usuario registrado exitosamente';
        messageDiv.classList.remove('d-none');

        //Limpiar formulario
        document.getElementById('registerForm').value = '';
        document.getElementById('nombreUsuario').value = '';
        document.getElementById('emailUsuario').value = '';
        document.getElementById('passwordUsuario').value = '';

        setTimeout(() => {
            window.location.href = 'compra-cliente.html';
        }, 1000);



    } else {
        document.getElementById('registerMessage').className = 'alert alert-danger mt-3';
        document.getElementById('registerMessage').textContent = "Ya existe un usuario con este email";
    }
});