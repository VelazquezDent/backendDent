const express = require('express');
const router = express.Router();
const tratamientoController = require('../controllers/tratamientoController');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

router.post('/crear', upload.single('imagen'), tratamientoController.crearTratamiento);
router.get('/', tratamientoController.obtenerTratamientos);
router.get('/buscar', tratamientoController.buscarTratamientos);  // Nueva ruta

router.put('/:id/estado', tratamientoController.actualizarEstadoTratamiento);
router.put('/:id', tratamientoController.actualizarTratamiento);


module.exports = router;
