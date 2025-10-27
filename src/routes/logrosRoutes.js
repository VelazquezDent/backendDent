const express = require("express");
const router = express.Router();
const logrosController = require("../controllers/logrosController");

// Paciente
router.get("/:usuarioId", logrosController.obtenerLogrosUsuario);
router.post("/evaluar/:usuarioId", logrosController.evaluarLogrosUsuario);

// Administrador
router.get("/admin/catalogo/listar", logrosController.listarLogrosCatalogo);
router.post("/admin/catalogo", logrosController.crearLogroCatalogo);
router.put("/admin/catalogo/:logroId", logrosController.actualizarLogroCatalogo);

module.exports = router;
