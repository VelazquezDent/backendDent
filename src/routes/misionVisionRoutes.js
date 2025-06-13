const express = require('express');
const router = express.Router();
const misionVisionController = require('../controllers/misionVisionController');

router.post('/crear', misionVisionController.crearNuevaMisionVision);
router.get('/vigentes', misionVisionController.obtenerAmbasVigentes);

router.get('/historial', misionVisionController.obtenerHistorial);
module.exports = router;
