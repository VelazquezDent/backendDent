const express = require('express');
const router = express.Router();
const tratamientoPacienteController = require('../controllers/tratamientoPacienteController');

// Ruta para crear tratamiento-paciente
router.post('/crear', tratamientoPacienteController.crearTratamientoCompleto);
// Ruta para obtener tratamientos en progreso
router.get('/en-progreso', tratamientoPacienteController.obtenerTratamientosEnProgreso);
router.get('/pendientes', tratamientoPacienteController.obtenerTratamientosPendientes);
// Nueva ruta para verificar si un usuario tiene un tratamiento activo
router.get('/verificar/:usuarioId', tratamientoPacienteController.verificarTratamientoActivo);
// Nuevo endpoint para obtener tratamientos activos por usuarioId
router.get("/activo/:usuarioId", tratamientoPacienteController.obtenerTratamientosActivosPorUsuario);
// Nueva ruta para generar citas y pagos
router.post('/crear-nuevas-citas-pagos', tratamientoPacienteController.crearNuevoTratamientoConCitasYPagos);

// Nueva ruta para obtener historial de tratamientos terminados
router.get('/historial', tratamientoPacienteController.obtenerHistorialTratamientos);
router.get('/verificar/:tipo/:id', tratamientoPacienteController.verificarTratamientoActivoTipo);

module.exports = router;
