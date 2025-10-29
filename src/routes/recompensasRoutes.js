const express = require('express');
const router = express.Router();
const recompensasController = require('../controllers/recompensasController');

// Catálogo visible al paciente
// GET /api/recompensas/catalogo
router.get('/catalogo', recompensasController.obtenerCatalogoRecompensas);

// Paciente solicita canje (crea registro pendiente y aparta puntos)
router.post('/canjear', recompensasController.solicitarCanje);

// Paciente ve su historial de canjes
// GET /api/recompensas/mis-solicitudes/:usuarioId
router.get('/mis-solicitudes/:usuarioId', recompensasController.obtenerMisSolicitudes);

// Admin ve solicitudes pendientes
// GET /api/recompensas/pendientes
router.get('/pendientes', recompensasController.obtenerPendientes);

// Admin resuelve canje (aprobado / rechazado / entregado)
router.put('/resolver/:canjeId', recompensasController.resolverCanje);
// NUEVO ENDPOINT
router.put('/entregar/:canjeId', recompensasController.marcarEntregado);
module.exports = router;
