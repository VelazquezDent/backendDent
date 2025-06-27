const express = require('express');
const router = express.Router();
const politicaController = require('../controllers/politicaController');

router.post('/crear', politicaController.crear);
router.get('/listar', politicaController.listar);
router.put('/editar/:id', politicaController.editar);
router.delete('/eliminarPolitica/:id', politicaController.eliminarPolitica);
module.exports = router;
