const express = require('express');
const router = express.Router();
const tratamientoPacienteController = require('../controllers/tratamientoPacienteController');

// Ruta para crear tratamiento-paciente
router.post('/crear', tratamientoPacienteController.crearTratamientoCompleto);
// Ruta para obtener tratamientos en progreso
router.get('/en-progreso', tratamientoPacienteController.obtenerTratamientosEnProgreso);

module.exports = router;
