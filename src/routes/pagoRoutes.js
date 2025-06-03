const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');

// Ruta para crear pagos
router.post('/crear', pagoController.crearPagos);
router.get('/pendientes/:usuarioId', pagoController.obtenerPagosPendientes);

module.exports = router;
