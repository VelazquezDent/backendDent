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

        await citaModel.crearCitas(citas);

        res.status(201).json({ mensaje: 'Citas creadas exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al crear las citas' });
    }
};
