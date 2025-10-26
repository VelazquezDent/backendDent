const moment = require('moment-timezone');
const { sumarPuntos } = require('../services/puntos'); // ← importa el helper
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
        console.error(" Error al actualizar la cita:", error);
        res.status(500).json({ mensaje: "Error interno al actualizar la cita." });
    }
};
exports.completarCita = async (req, res) => {
    try {
        const { id } = req.params; // ID de la cita
        const { comentario } = req.body;

        // 1️⃣ Verificar si la cita existe
        const citaExistente = await citaModel.obtenerCitaPorId(id);
        if (!citaExistente) {
            return res.status(404).json({ mensaje: "La cita no existe." });
        }

        // 2️⃣ Marcar la cita como completada (usa tu modelo)
        const resultado = await citaModel.marcarCitaComoCompletada(id, comentario);

        if (!resultado.success) {
            return res.status(500).json({ mensaje: "No se pudo actualizar la cita." });
        }

        const { usuarioId, termino } = resultado;

        // 3️⃣ Otorgar puntos (con try/catch interno para que no rompa el flujo)
        try {
            if (usuarioId) {
                // 🎯 +10 puntos por asistencia puntual (cita completada)
                await sumarPuntos(usuarioId, 10, 'CITA_PUNTUAL', 'cita', id);

                // 🎯 +50 puntos si con esta cita se terminó el tratamiento
                if (termino) {
                    await sumarPuntos(
                        usuarioId,
                        50,
                        'TRATAMIENTO_COMPLETADO',
                        'tratamiento_paciente',
                        citaExistente.tratamiento_paciente_id
                    );
                }
            }
        } catch (e) {
            console.error(' Error otorgando puntos:', e?.sqlMessage || e?.message || e);
        }

        // 4️⃣ Respuesta final
        return res.status(200).json({
            mensaje: "Cita marcada como completada y puntos otorgados correctamente.",
        });
    } catch (error) {
        console.error("❌ Error al marcar la cita como completada:", error?.sqlMessage || error?.message || error);
        res.status(500).json({ mensaje: "Error interno al marcar la cita como completada." });
    }
};
exports.actualizarFechaHoraCita = async (req, res) => {
    try {
        const { id } = req.params; // ID de la cita
        const { fechaHora } = req.body; // Nueva fecha y hora

        console.log(`📅 Intentando actualizar la cita ID: ${id} con nueva fecha/hora: ${fechaHora}`);

        if (!fechaHora) {
            return res.status(400).json({ mensaje: "La nueva fecha y hora son obligatorias." });
        }

        // Llamamos a la función del modelo para verificar y actualizar
        const resultado = await citaModel.actualizarFechaHoraCita(id, fechaHora);

        if (resultado.error) {
            return res.status(400).json({ mensaje: resultado.message });
        }

        console.log("✔️ Fecha y hora de la cita actualizadas correctamente.");
        res.status(200).json({ mensaje: "Fecha y hora de la cita actualizadas correctamente." });
    } catch (error) {
        console.error(" Error al actualizar la fecha y hora de la cita:", error);
        res.status(500).json({ mensaje: "Error interno al actualizar la cita." });
    }
};
exports.obtenerNotificacionesCitas = async (req, res) => {
    try {
        // Obtener citas para hoy y mañana
        const citas = await citaModel.obtenerNotificacionesCitas();

        // Obtener la fecha de hoy y mañana en la zona horaria de México
        const hoy = moment().tz("America/Mexico_City").format("YYYY-MM-DD");
        const mañana = moment().add(1, 'days').tz("America/Mexico_City").format("YYYY-MM-DD");

        // Formatear las citas con información de si es hoy o mañana
        const notificaciones = citas.map(cita => {
            const fechaCita = moment(cita.fecha_hora).tz("America/Mexico_City").format("YYYY-MM-DD");
            const horaCita = moment(cita.fecha_hora).tz("America/Mexico_City").format("HH:mm");

            let mensaje = "";
            if (fechaCita === hoy) {
                mensaje = `Hoy tienes una cita a las ${horaCita}`;
            } else if (fechaCita === mañana) {
                mensaje = `Mañana tienes una cita a las ${horaCita}`;
            }

            return {
                id: cita.id,
                fecha_hora: cita.fecha_hora,
                mensaje,
            };
        });

        res.status(200).json({ notificaciones });
    } catch (error) {
        console.error(" Error al obtener notificaciones de citas:", error);
        res.status(500).json({ mensaje: "Error interno al obtener notificaciones de citas." });
    }
};

exports.obtenerCitasPorFecha = async (req, res) => {
    try {
        const { fecha } = req.body;

        if (!fecha) {
            return res.status(400).json({ mensaje: "La fecha es requerida" });
        }

        const citas = await citaModel.obtenerCitasPorFecha(fecha);
        res.status(200).json({ citas });
    } catch (error) {
        console.error(" Error al obtener citas por fecha:", error);
        res.status(500).json({ mensaje: "Error al obtener las citas por fecha" });
    }
};
exports.obtenerHistorialCitasPorUsuario = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const citas = await citaModel.obtenerHistorialCitasPorUsuario(usuarioId);
        res.status(200).json(citas);
    } catch (error) {
        console.error("❌ Error al obtener historial de citas:", error);
        res.status(500).json({ mensaje: "Error al obtener historial de citas del usuario" });
    }
};

