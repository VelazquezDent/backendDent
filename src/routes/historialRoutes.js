const express = require('express');
const router = express.Router();
const historialController = require('../controllers/historialController');

// Obtener historiales médicos por usuario
router.get('/usuario/:usuarioId', historialController.obtenerHistorialesPorUsuario);
// Insertar un nuevo historial médico por usuario
router.post('/usuario/:usuarioId', historialController.insertarHistorialMedico);
// Insertar un nuevo historial médico por usuario
router.post('/usuario/sin-Plataforma/:paciente_Sin_PlataformaId', historialController.insertarHistorialMedicoSinCuenta);
// Obtener historiales médicos por usuario sin cuenta
router.get('/usuario/sin-Plataforma/:paciente_Sin_PlataformaId', historialController.obtenerHistorialesPorUsuarioSinCuenta);

module.exports = router;
