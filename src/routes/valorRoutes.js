const express = require('express');
const router = express.Router();
const valorController = require('../controllers/valorController');

router.post('/crear', valorController.crear);
router.get('/listar', valorController.listar);
router.put('/editar/:id', valorController.editar);

module.exports = router;
