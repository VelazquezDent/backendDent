const quienesSomosModel = require('../models/quienesSomosModel');

exports.crear = async (req, res) => {
  try {
    const { contenido } = req.body;
    if (!contenido || contenido.length < 10) {
      return res.status(400).json({ mensaje: "El contenido debe tener al menos 10 caracteres." });
    }

    const id = await quienesSomosModel.insertar(contenido);
    res.status(201).json({ mensaje: "Contenido registrado como vigente", id });
  } catch (error) {
    console.error(" Error al registrar quienes somos:", error);
    res.status(500).json({ mensaje: "Error interno al registrar contenido" });
  }
};

exports.listar = async (req, res) => {
  try {
    const datos = await quienesSomosModel.obtenerTodo();
    res.status(200).json(datos);
  } catch (error) {
    console.error(" Error al obtener quienes somos:", error);
    res.status(500).json({ mensaje: "Error al obtener contenido" });
  }
};

exports.obtenerVigente = async (req, res) => {
  try {
    const actual = await quienesSomosModel.obtenerVigente();
    res.status(200).json(actual);
  } catch (error) {
    console.error(" Error al obtener vigente:", error);
    res.status(500).json({ mensaje: "Error al obtener contenido vigente" });
  }
};

exports.editar = async (req, res) => {
  try {
    const { id } = req.params;
    const { contenido } = req.body;

    if (!contenido || contenido.length < 10) {
      return res.status(400).json({ mensaje: "El contenido debe tener al menos 10 caracteres." });
    }

    const ok = await quienesSomosModel.editarPorId(id, contenido);
    if (!ok) {
      return res.status(404).json({ mensaje: "No se encontró contenido con ese ID." });
    }

    res.status(200).json({ mensaje: "Contenido actualizado correctamente." });
  } catch (error) {
    console.error(" Error al editar quienes somos:", error);
    res.status(500).json({ mensaje: "Error interno al editar contenido" });
  }
};

exports.activar = async (req, res) => {
  try {
    const { id } = req.params;
    const ok = await quienesSomosModel.activarComoVigente(id);
    if (!ok) {
      return res.status(404).json({ mensaje: "No se encontró el contenido para activar." });
    }
    res.status(200).json({ mensaje: "Contenido activado como vigente." });
  } catch (error) {
    console.error(" Error al activar vigente:", error);
    res.status(500).json({ mensaje: "Error al activar contenido como vigente" });
  }
};
