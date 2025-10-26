const express = require("express");
const router = express.Router();
const puntosController = require("../controllers/puntosController");

// historial detallado de puntos del usuario
router.get("/historial/:usuarioId", puntosController.obtenerHistorial);

// saldo actual de puntos del usuario
router.get("/saldo/:usuarioId", puntosController.obtenerSaldo);

module.exports = router;
