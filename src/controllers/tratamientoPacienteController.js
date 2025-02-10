const tratamientoPacienteModel = require('../models/tratamientoPacienteModel');

exports.crearTratamientoPaciente = async (req, res) => {
    try {
        const { usuarioId, tratamientoId, citasTotales, fechaInicio,estado } = req.body;

        const tratamientoPacienteId = await tratamientoPacienteModel.crearTratamientoPaciente({
            usuarioId,
            tratamientoId,
            citasTotales,
            fechaInicio,
            estado
        });

        res.status(201).json({ tratamientoPacienteId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al crear el tratamiento del paciente' });
    }
};
