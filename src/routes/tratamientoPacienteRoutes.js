const express = require('express');
const router = express.Router();
const tratamientoPacienteController = require('../controllers/tratamientoPacienteController');

// Ruta para crear tratamiento-paciente
router.post('/crear', tratamientoPacienteController.crearTratamientoCompleto);

module.exports = router;
