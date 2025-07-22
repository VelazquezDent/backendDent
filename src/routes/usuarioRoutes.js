const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const autenticarUsuario = require('../Middleware/authMiddleware');


// Ruta para registrar un usuario
router.post('/registrar', usuarioController.registrarUsuario);
// Ruta para verificar el código
router.post('/verificar', usuarioController.verificarCodigo);

// Ruta para el login del usuario
router.post('/login', usuarioController.loginUsuario);
// Ruta para cerrar sesión
router.post('/logout', usuarioController.logoutUsuario);

// Ruta para enviar el correo de recuperación
router.post('/recuperar-password', usuarioController.enviarCorreoRecuperacion);
// Ruta para el cambio de contraseña
router.post('/cambiar-password', usuarioController.cambiarPassword);

// Ruta para verificar la sesión (protegida)
router.get('/verificar-sesion', autenticarUsuario(), usuarioController.verificarSesion);
// Endpoint para buscar usuario
router.post('/buscar', usuarioController.buscarUsuario);
// Ruta para obtener la lista de todos los pacientes
router.get('/pacientes', usuarioController.obtenerPacientes);
// Ruta para obtener la información personal del usuario por ID
router.get('/perfil/:id', usuarioController.obtenerPerfilUsuario);
// Ruta para cambiar la contraseña por ID
router.post('/cambiar-password/:id', usuarioController.cambiarPasswordPorId);

router.get('/prediccion-pacientes', usuarioController.obtenerPacientesParaPrediccion);

module.exports = router;
