const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');

router.get('/citas', reportesController.obtenerResumenCitas);

router.get('/ingresos', reportesController.obtenerIngresosMensuales);

router.get('/tratamientos', reportesController.obtenerTratamientosPopulares);

module.exports = router;
