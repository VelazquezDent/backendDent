const citaModel = require('../models/citaModel');

exports.crearCitas = async (req, res) => {
    try {
        const { tratamientoPacienteId, fechaHora, citasTotales } = req.body;

        // Primera cita con fecha seleccionada
        const citas = [[tratamientoPacienteId, fechaHora, 'pendiente', 0]];

        // Citas restantes con fecha NULL
        for (let i = 1; i < citasTotales; i++) {
            citas.push([tratamientoPacienteId, null, 'pendiente', 0]);
        }

        // Insertar las citas en la base de datos
        const resultado = await citaModel.crearCitas(citas);

        // Recuperar las citas creadas (puedes ajustar esto según cómo estés manejando los IDs)
        const citasCreadas = await citaModel.obtenerCitasPorTratamiento(tratamientoPacienteId);

        res.status(201).json({ mensaje: 'Citas creadas exitosamente', citas: citasCreadas });
    } catch (error) {
        console.error('Error al crear las citas:', error);
        res.status(500).json({ mensaje: 'Error al crear las citas' });
    }
};
exports.obtenerCitasPorUsuario = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const citas = await citaModel.obtenerCitasPorUsuario(usuarioId);
        res.status(200).json(citas);
    } catch (error) {
        console.error('Error al obtener citas del usuario:', error);
        res.status(500).json({ mensaje: 'Error al obtener citas del usuario' });
    }
};
exports.obtenerProximasCitas = async (req, res) => {
    try {
        const citas = await citaModel.obtenerProximasCitas();
        res.status(200).json(citas);
    } catch (error) {
        console.error('Error al obtener las próximas citas:', error);
        res.status(500).json({ mensaje: 'Error al obtener las próximas citas' });
    }
};
exports.obtenerCitasActivas = async (req, res) => {
    try {
        const citas = await citaModel.obtenerCitasActivas();
        res.status(200).json(citas);
    } catch (error) {
        console.error('Error al obtener citas activas:', error);
        res.status(500).json({ mensaje: 'Error al obtener citas activas' });
    }
};
exports.obtenerCitasPorTratamiento = async (req, res) => {
    try {
        const { tratamientoPacienteId } = req.params;
        const citas = await citaModel.obtenerCitasPorTratamiento(tratamientoPacienteId);
        res.status(200).json(citas);
    } catch (error) {
        console.error('Error al obtener citas del tratamiento:', error);
        res.status(500).json({ mensaje: 'Error al obtener citas del tratamiento' });
    }
};
exports.actualizarFechaHoraCita = async (req, res) => {
    try {
        const { id } = req.params; // ID de la cita
        const { fechaHora } = req.body; // Nueva fecha y hora

        if (!fechaHora) {
            return res.status(400).json({ mensaje: "La nueva fecha y hora son obligatorias." });
        }

        // Actualizar la cita en la base de datos
        const resultado = await citaModel.actualizarFechaHoraCita(id, fechaHora);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensaje: "No se encontró la cita o ya fue asignada." });
        }

        res.status(200).json({ mensaje: "Fecha y hora de la cita actualizadas correctamente." });
    } catch (error) {
        console.error("❌ Error al actualizar la cita:", error);
        res.status(500).json({ mensaje: "Error interno al actualizar la cita." });
    }
};
