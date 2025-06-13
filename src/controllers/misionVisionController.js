const misionVisionModel = require('../models/misionVisionModel');

exports.crearNuevaMisionVision = async (req, res) => {
    try {
        const { tipo, contenido } = req.body;

        if (!tipo || !contenido) {
            return res.status(400).json({ mensaje: "El tipo y contenido son obligatorios." });
        }

        // Obtener última versión
        const ultimaVersion = await misionVisionModel.obtenerUltimaVersion(tipo);
        const nuevaVersion = ultimaVersion > 0 ? ultimaVersion + 1.0 : 1.0;

        // Marcar versiones anteriores como no vigentes
        if (ultimaVersion > 0) {
            await misionVisionModel.marcarComoNoVigente(tipo);
        }

        // Insertar la nueva
        const nuevaId = await misionVisionModel.insertarNuevaVersion(tipo, contenido, nuevaVersion);

        res.status(201).json({
            mensaje: "Versión creada exitosamente",
            id: nuevaId,
            version: nuevaVersion,
            vigente: 1,
        });

    } catch (error) {
        console.error("❌ Error al crear nueva misión/visión:", error);
        res.status(500).json({ mensaje: "Error interno al crear nueva versión" });
    }
};

exports.obtenerAmbasVigentes = async (req, res) => {
    try {
        const mision = await misionVisionModel.obtenerVigentePorTipo('mision');
        const vision = await misionVisionModel.obtenerVigentePorTipo('vision');

        res.status(200).json({
            mision: mision || null,
            vision: vision || null
        });
    } catch (error) {
        console.error("❌ Error al obtener misión y visión vigentes:", error);
        res.status(500).json({ mensaje: "Error interno al obtener información vigente." });
    }
};
exports.obtenerHistorial = async (req, res) => {
    try {
        const historial = await misionVisionModel.obtenerHistorial();
        res.status(200).json(historial);
    } catch (error) {
        console.error("❌ Error al obtener historial:", error);
        res.status(500).json({ mensaje: "Error al obtener historial de misión/visión" });
    }
};