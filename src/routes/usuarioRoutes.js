const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// Ruta para registrar un usuario
router.post('/registrar', usuarioController.registrarUsuario);
// Ruta para verificar el código
router.post('/verificar', usuarioController.verificarCodigo);

// Ruta para el login del usuario
router.post('/login', usuarioController.loginUsuario);
// Ruta para enviar el correo de recuperación
router.post('/recuperar-password', usuarioController.enviarCorreoRecuperacion);
// Ruta para el cambio de contraseña
router.post('/cambiar-password', usuarioController.cambiarPassword);
module.exports = router;
