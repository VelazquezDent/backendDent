const express = require('express');
const router = express.Router();
const citaController = require('../controllers/citaController');

// Ruta para crear citas
router.post('/crear', citaController.crearCitas);

module.exports = router;
