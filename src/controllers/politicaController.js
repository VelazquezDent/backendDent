const politicaModel = require('../models/politicaModel');

exports.crear = async (req, res) => {
  try {
    const { titulo, descripcion } = req.body;
    if (!titulo || !descripcion) {
      return res.status(400).json({ mensaje: "Título y descripción son requeridos." });
    }

    const id = await politicaModel.insertar(titulo, descripcion);
    res.status(201).json({ mensaje: "Política registrada", id });
  } catch (error) {
    console.error("❌ Error al registrar política:", error);
    res.status(500).json({ mensaje: "Error interno al registrar política" });
  }
};

exports.listar = async (req, res) => {
  try {
    const politicas = await politicaModel.obtenerTodas();
    res.status(200).json(politicas);
  } catch (error) {
    console.error("❌ Error al obtener políticas:", error);
    res.status(500).json({ mensaje: "Error al obtener políticas" });
  }
};

exports.editar = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion } = req.body;

    if (!titulo || !descripcion) {
      return res.status(400).json({ mensaje: "Título y descripción son requeridos." });
    }

    const ok = await politicaModel.editarPorId(id, titulo, descripcion);
    if (!ok) {
      return res.status(404).json({ mensaje: "No se encontró política con ese ID." });
    }

    res.status(200).json({ mensaje: "Política actualizada correctamente." });
  } catch (error) {
    console.error("❌ Error al editar política:", error);
    res.status(500).json({ mensaje: "Error al editar política" });
  }
};
