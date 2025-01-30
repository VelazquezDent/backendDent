const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// Ruta para registrar un usuario
router.post('/registrar', usuarioController.registrarUsuario);
// Ruta para verificar el código
router.post('/verificar', usuarioController.verificarCodigo);

// Ruta para el login del usuario
router.post('/login', usuarioController.loginUsuario);
module.exports = router;
