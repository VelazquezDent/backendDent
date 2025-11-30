const pacienteModel = require('../models/pacienteSinPlataformaModel');

// Función para registrar un paciente sin plataforma
const registrarPacienteSinPlataforma = async (req, res) => {
    try {
        const { nombre, apellido_paterno, apellido_materno, telefono, fecha_nacimiento, sexo, email, fecha_registro } = req.body;

        // Validaciones básicas (email es opcional)
        if (!nombre || !apellido_paterno || !apellido_materno || !fecha_nacimiento || !telefono || !sexo || !fecha_registro) {
            return res.status(400).json({ mensaje: 'Todos los campos son obligatorios, excepto el email.' });
        }

        // Verificar si el paciente ya existe (por teléfono o email)
        const pacienteExistente = await pacienteModel.obtenerPacienteSinPlataformaExistentes(email, telefono);
        if (pacienteExistente) {
            // Determinar qué campo causó el conflicto
            let mensajeError = 'El paciente ya está registrado: ';
            if (pacienteExistente.telefono === telefono && pacienteExistente.email === email) {
                mensajeError += 'el teléfono y el email ya existen.';
            } else if (pacienteExistente.telefono === telefono) {
                mensajeError += 'el teléfono ya existe.';
            } else if (pacienteExistente.email === email) {
                mensajeError += 'el email ya existe.';
            }
            return res.status(409).json({ mensaje: mensajeError });
        }

        // Registrar al paciente sin plataforma
        const pacienteId = await pacienteModel.crearPacienteSinPlataforma({
            nombre,
            apellido_paterno,
            apellido_materno,
            telefono,
            fecha_nacimiento,
            sexo,
            email: email || null,
            fecha_registro
        });

        res.status(201).json({ mensaje: 'Paciente registrado exitosamente.', paciente_id: pacienteId });
    } catch (error) {
        console.error('Error al registrar paciente sin plataforma:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};

const obtenerPacientesSinCuenta = async (req, res) => {
    try {
        const pacientes = await pacienteModel.obtenerPacienteSinPlataforma();
        // Siempre devolvemos un arreglo, vacío si no hay datos
        res.status(200).json(pacientes || []);
    } catch (error) {
        console.error("Error al obtener pacientes:", error);
        res.status(500).json({ mensaje: "Error interno del servidor." });
    }
};
// EDITAR datos personales de paciente sin plataforma
const editarPacienteSinPlataforma = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellido_paterno, apellido_materno, telefono, fecha_nacimiento, sexo, email } = req.body;

        if (!nombre || !apellido_paterno || !apellido_materno || !telefono || !fecha_nacimiento || !sexo) {
            return res.status(400).json({ mensaje: 'Todos los campos son obligatorios (email opcional).' });
        }

        // Verificar conflicto de teléfono / email con OTROS pacientes
        const pacienteExistente = await pacienteModel.obtenerPacienteSinPlataformaExistentesEditar(email, telefono, id);
        if (pacienteExistente) {
            let mensajeError = 'No se puede actualizar: ';
            if (pacienteExistente.telefono === telefono && pacienteExistente.email === email) {
                mensajeError += 'el teléfono y el email ya pertenecen a otro paciente.';
            } else if (pacienteExistente.telefono === telefono) {
                mensajeError += 'el teléfono ya pertenece a otro paciente.';
            } else if (pacienteExistente.email === email) {
                mensajeError += 'el email ya pertenece a otro paciente.';
            }
            return res.status(409).json({ mensaje: mensajeError });
        }

        await pacienteModel.actualizarPacienteSinPlataforma(id, {
            nombre,
            apellido_paterno,
            apellido_materno,
            telefono,
            fecha_nacimiento,   // aquí igual: string 'YYYY-MM-DD'
            sexo,
            email: email || null,
        });

        res.status(200).json({ mensaje: 'Datos personales actualizados correctamente.' });
    } catch (error) {
        console.error("Error al actualizar paciente sin plataforma:", error);
        res.status(500).json({ mensaje: "Error interno del servidor." });
    }
};
const eliminarPacienteSinPlataforma = async (req, res) => {
    try {
        const { id } = req.params;

        const eliminado =
            await pacienteModel.eliminarPacienteSinPlataformaCompleto(id);

        if (!eliminado) {
            return res.status(404).json({ mensaje: "Paciente no encontrado." });
        }

        return res.status(200).json({
            mensaje:
                "Paciente sin plataforma y todas sus relaciones (pagos, citas, tratamientos, historial) fueron eliminados correctamente.",
        });
    } catch (error) {
        console.error(
            "Error al eliminar paciente sin plataforma y sus relaciones:",
            error
        );
        return res.status(500).json({ mensaje: "Error interno del servidor." });
    }
};

module.exports = {
    registrarPacienteSinPlataforma,
    obtenerPacientesSinCuenta,
    editarPacienteSinPlataforma,
    eliminarPacienteSinPlataforma
};