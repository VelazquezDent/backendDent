const tratamientoPacienteModel = require('../models/tratamientoPacienteModel');
const citaModel = require('../models/citaModel');
const pagoModel = require('../models/pagoModel');

exports.crearTratamientoCompleto = async (req, res) => {
    try {
        const { usuarioId, tratamientoId, citasTotales, fechaInicio, estado, precio, requiereEvaluacion } = req.body;

        // 1. Crear el tratamiento del paciente
        const tratamientoPacienteId = await tratamientoPacienteModel.crearTratamientoPaciente({
            usuarioId,
            tratamientoId,
            citasTotales,
            fechaInicio,
            estado
        });

        // Si el tratamiento requiere evaluación, no se crean citas ni pagos
        if (requiereEvaluacion) {
            return res.status(201).json({
                mensaje: 'Tratamiento creado exitosamente, pendiente de evaluación.',
                tratamientoPacienteId
            });
        }

        // 2. Crear las citas asociadas
        const citas = [[tratamientoPacienteId, fechaInicio, 'pendiente', 0]];
        for (let i = 1; i < citasTotales; i++) {
            citas.push([tratamientoPacienteId, null, 'pendiente', 0]);
        }

        await citaModel.crearCitas(citas);

        // 3. Obtener las citas creadas
        const citasCreadas = await citaModel.obtenerCitasPorTratamiento(tratamientoPacienteId);

        // 4. Crear los pagos asociados
        const pagos = citasCreadas.map(cita => [
            usuarioId,
            null,  // pacienteId es opcional
            cita.id,
            precio,
            null,  // Método de pago será nulo inicialmente
            'pendiente',
            null  // Fecha de pago estará inicialmente en null
        ]);

        await pagoModel.crearPagos(pagos);

        // 5. Responder con éxito
        res.status(201).json({
            mensaje: 'Tratamiento, citas y pagos creados exitosamente',
            tratamientoPacienteId
        });
    } catch (error) {
        console.error('Error al crear el tratamiento completo:', error);
        res.status(500).json({ mensaje: 'Error al crear el tratamiento completo' });
    }
};
exports.obtenerTratamientosEnProgreso = async (req, res) => {
    try {
        const tratamientos = await tratamientoPacienteModel.obtenerTratamientosEnProgreso();
        res.status(200).json(tratamientos);
    } catch (error) {
        console.error('Error al obtener tratamientos en progreso:', error);
        res.status(500).json({ mensaje: 'Error al obtener tratamientos en progreso' });
    }
};