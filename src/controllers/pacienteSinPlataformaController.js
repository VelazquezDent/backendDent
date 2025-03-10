const pacienteModel = require('../models/pacienteSinPlataformaModel');

// Función para registrar un paciente sin plataforma
const registrarPacienteSinPlataforma = async (req, res) => {
    try {
        const { nombre, apellido_paterno, apellido_materno, telefono, fecha_nacimiento, sexo, email } = req.body;

        // Validaciones básicas
        if (!nombre || !apellido_paterno || !apellido_materno || !fecha_nacimiento || !telefono || !sexo || !email) {
            return res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
        }

        // Verificar si el paciente ya existe
        const pacienteExistente = await pacienteModel.obtenerPacienteSinPlataforma(email, telefono);
        if (pacienteExistente) {
            return res.status(409).json({ mensaje: 'El paciente ya está registrado.' });
        }

        // Registrar al paciente sin plataforma
        const pacienteId = await pacienteModel.crearPacienteSinPlataforma({
            nombre,
            apellido_paterno,
            apellido_materno,
            telefono,
            fecha_nacimiento,
            sexo,
            email
        });

        res.status(201).json({ mensaje: 'Paciente registrado exitosamente.', paciente_id: pacienteId });
    } catch (error) {
        console.error('Error al registrar paciente sin plataforma:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};
const obtenerPacientesSinCuenta = async (req, res) => {
    try {
        // Consultar la base de datos para obtener solo los usuarios de tipo "paciente"
        const pacientes = await pacienteModel.obtenerPacienteSinPlataforma();

        // Verificar si hay pacientes en la base de datos
        if (!pacientes.length) {
            return res.status(404).json({ mensaje: "No hay pacientes registrados." });
        }

        res.status(200).json(pacientes);
    } catch (error) {
        console.error("Error al obtener pacientes:", error);
        res.status(500).json({ mensaje: "Error interno del servidor." });
    }
};
module.exports = {
    registrarPacienteSinPlataforma,
    obtenerPacientesSinCuenta,
};
