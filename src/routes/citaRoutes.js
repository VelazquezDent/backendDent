const express = require('express');
const router = express.Router();
const citaController = require('../controllers/citaController');

// Ruta para crear citas
router.post('/crear', citaController.crearCitas);
// Obtener citas de un usuario específico
router.get('/usuario/:usuarioId', citaController.obtenerCitasPorUsuario);
// 👇 NUEVA RUTA
router.get('/usuario/detalle/:usuarioId', citaController.obtenerCitasPorUsuarioConTratamiento);

// Ruta para obtener las próximas citas (estado NULL y con fecha definida)
router.get('/proximas', citaController.obtenerProximasCitas);
router.get('/activas', citaController.obtenerCitasActivas);
// Ruta para obtener citas de un tratamiento específico
router.get('/tratamiento/:tratamientoPacienteId', citaController.obtenerCitasPorTratamiento);
router.put('/actualizar/:id', citaController.actualizarFechaHoraCita);
router.put('/completar/:id', citaController.completarCita);
router.put('/actualizar-fecha-hora/:id', citaController.actualizarFechaHoraCita);
router.get('/notificaciones', citaController.obtenerNotificacionesCitas);
router.post('/por-fecha', citaController.obtenerCitasPorFecha);
router.get('/historial/:usuarioId', citaController.obtenerHistorialCitasPorUsuario);


module.exports = router;
