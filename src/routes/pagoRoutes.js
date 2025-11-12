const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');

// Ruta para crear pagos
router.post('/crear', pagoController.crearPagos);
router.get('/pendientes/:usuarioId', pagoController.obtenerPagosPendientes);
router.get('/pacientes-con-tratamiento', pagoController.obtenerPacientesConTratamientoActivo);
router.put('/actualizar-pagos', pagoController.actualizarPagosYMarcarCitas);
router.get('/historial', pagoController.obtenerHistorialPagosAdmin);
router.get('/historial/:usuarioId', pagoController.obtenerHistorialPagos);
router.post('/pagar-por-ids', pagoController.pagarPagosPorIds);
router.post('/crear-checkout', pagoController.crearCheckoutStripe);
router.post('/movil/confirmar', pagoController.confirmarPagoMovil);

module.exports = router;
