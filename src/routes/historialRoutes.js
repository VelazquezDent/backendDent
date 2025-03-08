const express = require('express');
const router = express.Router();
const historialController = require('../controllers/historialController');

// Obtener historiales médicos por usuario
router.get('/usuario/:usuarioId', historialController.obtenerHistorialesPorUsuario);
// Insertar un nuevo historial médico por usuario
router.post('/usuario/:usuarioId', historialController.insertarHistorialMedico);

module.exports = router;
