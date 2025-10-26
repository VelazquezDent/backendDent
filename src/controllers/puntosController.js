const puntosModel = require("../models/puntosModel");

// GET /api/puntos/historial/:usuarioId
exports.obtenerHistorial = async (req, res) => {
    try {
        const { usuarioId } = req.params;

        if (!usuarioId) {
            return res.status(400).json({ mensaje: "Falta usuarioId" });
        }

        const historial = await puntosModel.obtenerHistorialPuntos(usuarioId);

        return res.status(200).json(historial);
    } catch (error) {
        console.error("Error al obtener historial de puntos:", error);
        return res.status(500).json({ mensaje: "Error interno al obtener historial de puntos" });
    }
};

// GET /api/puntos/saldo/:usuarioId
exports.obtenerSaldo = async (req, res) => {
    try {
        const { usuarioId } = req.params;

        if (!usuarioId) {
            return res.status(400).json({ mensaje: "Falta usuarioId" });
        }

        const saldo = await puntosModel.obtenerSaldoPuntos(usuarioId);

        return res.status(200).json(saldo);
    } catch (error) {
        console.error("Error al obtener saldo de puntos:", error);
        return res.status(500).json({ mensaje: "Error interno al obtener saldo de puntos" });
    }
};
