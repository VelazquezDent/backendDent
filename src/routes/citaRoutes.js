const express = require('express');
const router = express.Router();
const citaController = require('../controllers/citaController');

// Ruta para crear citas
router.post('/crear', citaController.crearCitas);
// Obtener citas de un usuario específico
router.get('/usuario/:usuarioId', citaController.obtenerCitasPorUsuario);
module.exports = router;
