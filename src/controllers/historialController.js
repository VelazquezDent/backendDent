const historialModel = require('../models/historialModel');

exports.obtenerHistorialesPorUsuario = async (req, res) => {
    try {
        const { usuarioId,  } = req.params;
        const historiales = await historialModel.obtenerHistorialesPorUsuario(usuarioId);

        if (historiales.length === 0) {
            console.warn(`⚠️ No hay historiales médicos.`);
            return res.status(200).json([]); // ✅ Devolver 200 con array vacío en vez de 404
        }

        res.status(200).json(historiales);
    } catch (error) {
        console.error('❌ Error al obtener los historiales médicos del usuario:', error);
        res.status(500).json({ mensaje: 'Error interno al obtener los historiales médicos del usuario.' });
    }
};
exports.obtenerHistorialesPorUsuarioSinCuenta = async (req, res) => {
    try {
        const { paciente_Sin_PlataformaId, } = req.params;
        const historiales = await historialModel.obtenerHistorialesPorUsuarioSinCuenta(paciente_Sin_PlataformaId);

        if (historiales.length === 0) {
            console.warn(`⚠️ No hay historiales médicos.`);
            return res.status(200).json([]); // ✅ Devolver 200 con array vacío en vez de 404
        }

        res.status(200).json(historiales);
    } catch (error) {
        console.error('❌ Error al obtener los historiales médicos del usuario:', error);
        res.status(500).json({ mensaje: 'Error interno al obtener los historiales médicos del usuario.' });
    }
};
exports.insertarHistorialMedico = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const historialData = req.body;

        const resultado = await historialModel.insertarHistorialMedico(usuarioId, historialData);

        if (resultado.affectedRows === 0) {
            return res.status(400).json({ mensaje: "No se pudo insertar el historial médico." });
        }

        res.status(201).json({ mensaje: "Historial médico insertado exitosamente." });
    } catch (error) {
        console.error('Error al insertar historial médico:', error);
        res.status(500).json({ mensaje: 'Error interno al insertar historial médico.' });
    }
};
exports.insertarHistorialMedicoSinCuenta= async (req, res) => {
    try {
        const { paciente_Sin_PlataformaId } = req.params;
        const historialData = req.body;
        

        const resultado = await historialModel.insertarHistorialMedicoSinCuenta(paciente_Sin_PlataformaId, historialData);

        if (resultado.affectedRows === 0) {
            return res.status(400).json({ mensaje: "No se pudo insertar el historial médico." });
        }

        res.status(201).json({ mensaje: "Historial médico insertado exitosamente." });
    } catch (error) {
        console.error('Error al insertar historial médico:', error);
        res.status(500).json({ mensaje: 'Error interno al insertar historial médico.' });
    }
};

