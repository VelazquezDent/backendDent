const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');

// Ruta para crear pagos
router.post('/crear', pagoController.crearPagos);
router.get('/pendientes/:usuarioId', pagoController.obtenerPagosPendientes);
router.get('/pacientes-con-tratamiento', pagoController.obtenerPacientesConTratamientoActivo);
router.put('/actualizar-pagos', pagoController.actualizarPagosYMarcarCitas);
router.get('/historial', pagoController.obtenerHistorialPagos);

module.exports = router;
