const db = require('../db');

exports.crearTratamientoPaciente = async (data) => {
    const query = `
        INSERT INTO tratamientos_pacientes 
        (usuario_id, tratamiento_id, citas_totales, citas_asistidas, estado, fecha_inicio) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [data.usuarioId, data.tratamientoId, data.citasTotales, 0, data.estado, data.fechaInicio];
    const [result] = await db.query(query, values);
    return result.insertId;
};
