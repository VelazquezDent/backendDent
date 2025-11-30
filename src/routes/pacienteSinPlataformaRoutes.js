const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/pacienteSinPlataformaController');

// Ruta para registrar un paciente sin plataforma
router.post('/registrar', pacienteController.registrarPacienteSinPlataforma);
// Ruta para obtener pacientes sin plataforma
router.get('/', pacienteController.obtenerPacientesSinCuenta);
// EDITAR datos personales de un paciente sin plataforma
router.put('/:id/datos-personales', pacienteController.editarPacienteSinPlataforma);
// Eliminar paciente + todas sus relaciones
router.delete("/:id", pacienteController.eliminarPacienteSinPlataforma);

module.exports = router;
