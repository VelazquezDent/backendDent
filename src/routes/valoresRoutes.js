const express = require('express');
const router = express.Router();
const valoresController= require('../controllers/valoresController');

router.get('/', valoresController.getValores);
router.post('/', valoresController.postValor);
router.put('/:id', valoresController.putValor);
router.delete('/:id', valoresController.deleteValor);

module.exports = router;
