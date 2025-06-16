const valorModel = require('../models/valorModel');

exports.crear = async (req, res) => {
  try {
    const { valor, descripcion } = req.body;
    if (!valor || !descripcion) {
      return res.status(400).json({ mensaje: "Todos los campos son requeridos." });
    }

    const id = await valorModel.insertar(valor, descripcion);
    res.status(201).json({ mensaje: "Valor registrado", id });
  } catch (error) {
    console.error("❌ Error al registrar valor:", error);
    res.status(500).json({ mensaje: "Error interno al registrar valor" });
  }
};

exports.listar = async (req, res) => {
  try {
    const valores = await valorModel.obtenerTodos();
    res.status(200).json(valores);
  } catch (error) {
    console.error("❌ Error al obtener valores:", error);
    res.status(500).json({ mensaje: "Error al obtener valores" });
  }
};

exports.editar = async (req, res) => {
  try {
    const { id } = req.params;
    const { valor, descripcion } = req.body;

    if (!valor || !descripcion) {
      return res.status(400).json({ mensaje: "Todos los campos son requeridos." });
    }

    const ok = await valorModel.editarPorId(id, valor, descripcion);
    if (!ok) {
      return res.status(404).json({ mensaje: "No se encontró valor con ese ID." });
    }

    res.status(200).json({ mensaje: "Valor actualizado correctamente." });
  } catch (error) {
    console.error("❌ Error al editar valor:", error);
    res.status(500).json({ mensaje: "Error al editar valor" });
  }
};
