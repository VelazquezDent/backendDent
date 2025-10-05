const configuracionesModel = require('../models/configuracionesModel');

exports.obtenerConfiguraciones = async (req, res) => {
  try {
    const config = await configuracionesModel.obtener();
    res.status(200).json(config);
  } catch (error) {
    console.error(" Error al obtener configuraciones:", error);
    res.status(500).json({ mensaje: "Error al obtener configuración" });
  }
};

exports.actualizarConfiguraciones = async (req, res) => {
  try {
    const { max_intentos, tiempo_bloqueo } = req.body;

    if (
      !Number.isInteger(max_intentos) || max_intentos <= 0 ||
      !Number.isInteger(tiempo_bloqueo) || tiempo_bloqueo <= 0
    ) {
      return res.status(400).json({ mensaje: "Valores inválidos" });
    }

    const ok = await configuracionesModel.actualizar(max_intentos, tiempo_bloqueo);
    if (!ok) {
      return res.status(404).json({ mensaje: "No se pudo actualizar la configuración." });
    }

    res.status(200).json({ mensaje: "Configuraciones actualizadas correctamente." });
  } catch (error) {
    console.error(" Error al actualizar configuraciones:", error);
    res.status(500).json({ mensaje: "Error interno" });
  }
};
