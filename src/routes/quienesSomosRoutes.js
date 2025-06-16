const express = require('express');
const router = express.Router();
const quienesSomosController = require('../controllers/quienesSomosController');

router.post('/crear', quienesSomosController.crear);
router.get('/listar', quienesSomosController.listar);
router.put('/editar/:id', quienesSomosController.editar);

module.exports = router;
