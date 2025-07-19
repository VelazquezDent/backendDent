const express = require('express');
const router = express.Router();
const configuracionesController = require('../controllers/configuracionesController');

router.get('/obtener', configuracionesController.obtenerConfiguraciones);
router.put('/actualizar', configuracionesController.actualizarConfiguraciones);

module.exports = router;
