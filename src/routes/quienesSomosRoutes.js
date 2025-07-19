const express = require('express');
const router = express.Router();
const quienesSomosController = require('../controllers/quienesSomosController');

router.post('/crear', quienesSomosController.crear);             // Crea y marca como vigente
router.get('/listar', quienesSomosController.listar);            // Historial
router.get('/vigente', quienesSomosController.obtenerVigente);   // Solo vigente
router.put('/editar/:id', quienesSomosController.editar);        // Edita uno
router.put('/activar/:id', quienesSomosController.activar);      // Activa uno como vigente

module.exports = router;
