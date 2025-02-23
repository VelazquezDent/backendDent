const db = require('../db');

exports.crearTratamientoPaciente = async (data, connection) => {
    const query = `
        INSERT INTO tratamientos_pacientes 
        (usuario_id, tratamiento_id, citas_totales, citas_asistidas, estado, fecha_inicio) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [data.usuarioId, data.tratamientoId, data.citasTotales, 0, data.estado, data.fechaInicio];
    const [result] = await connection.query(query, values);
    return result.insertId;
};

exports.obtenerTratamientosEnProgreso = async () => {
    const query = `
    SELECT tp.id, 
           COALESCE(u.id, p.id) AS paciente_id,
           COALESCE(u.nombre, p.nombre) AS nombre,
           COALESCE(u.apellido_paterno, p.apellido_paterno) AS apellido_paterno,
           COALESCE(u.apellido_materno, p.apellido_materno) AS apellido_materno,
           COALESCE(u.telefono, p.telefono) AS telefono,
           COALESCE(u.email, p.email) AS email,
           TIMESTAMPDIFF(YEAR, COALESCE(u.fecha_nacimiento, p.fecha_nacimiento), CURDATE()) AS edad,
           COALESCE(u.sexo, p.sexo) AS sexo,
           t.nombre AS tratamiento_nombre,
           tp.citas_totales, 
           tp.citas_asistidas, 
           tp.estado, 
           DATE_FORMAT(tp.fecha_inicio, '%Y-%m-%d') AS fecha_inicio, 
           DATE_FORMAT(tp.fecha_finalizacion, '%Y-%m-%d') AS fecha_finalizacion
    FROM tratamientos_pacientes tp
    LEFT JOIN usuarios u ON tp.usuario_id = u.id
    LEFT JOIN pacientes_sin_plataforma p ON tp.paciente_id = p.id
    JOIN tratamientos t ON tp.tratamiento_id = t.id
    WHERE tp.estado = ?;
`;

const values = ['en progreso'];
const [rows] = await db.query(query, values);
return rows;

};
exports.obtenerTratamientosPendientes = async () => {
    const query = `
        SELECT tp.id, 
               COALESCE(u.id, p.id) AS paciente_id,
               COALESCE(u.nombre, p.nombre) AS nombre,
               COALESCE(u.apellido_paterno, p.apellido_paterno) AS apellido_paterno,
               COALESCE(u.apellido_materno, p.apellido_materno) AS apellido_materno,
               COALESCE(u.telefono, p.telefono) AS telefono,
               COALESCE(u.email, p.email) AS email,
           TIMESTAMPDIFF(YEAR, COALESCE(u.fecha_nacimiento, p.fecha_nacimiento), CURDATE()) AS fecha_nacimiento, -- ✅ Cambio aquí
               COALESCE(u.sexo, p.sexo) AS sexo,
               t.nombre AS tratamiento_nombre,
               DATE_FORMAT(tp.fecha_inicio, '%Y-%m-%d') AS fecha_inicio
        FROM tratamientos_pacientes tp
        LEFT JOIN usuarios u ON tp.usuario_id = u.id
        LEFT JOIN pacientes_sin_plataforma p ON tp.paciente_id = p.id
        JOIN tratamientos t ON tp.tratamiento_id = t.id
        WHERE tp.estado = ?;
    `;

    const values = ['pendiente'];
    const [rows] = await db.query(query, values);
    return rows;
};
exports.tieneTratamientoActivo = async (usuarioId) => {
    const query = `
        SELECT id, estado FROM tratamientos_pacientes 
        WHERE usuario_id = ? AND estado IN ('en progreso', 'pendiente')
    `;
    const [rows] = await db.query(query, [usuarioId]);
    return rows.length > 0 ? rows[0] : null;
};

exports.haCompletadoTratamiento = async (usuarioId) => {
    const query = `
        SELECT id FROM tratamientos_pacientes 
        WHERE usuario_id = ? AND estado = 'terminado'
    `;
    const [rows] = await db.query(query, [usuarioId]);
    return rows.length > 0;
};
exports.obtenerTratamientosActivosPorUsuario = async (usuarioId) => {
    const query = `
        SELECT tp.id, u.nombre, u.apellido_paterno, u.apellido_materno, t.nombre AS tratamiento_nombre, 
               tp.citas_totales, tp.citas_asistidas, tp.estado, 
               DATE_FORMAT(tp.fecha_inicio, '%Y-%m-%d') AS fecha_inicio, 
               DATE_FORMAT(tp.fecha_finalizacion, '%Y-%m-%d') AS fecha_finalizacion
        FROM tratamientos_pacientes tp
        JOIN usuarios u ON tp.usuario_id = u.id
        JOIN tratamientos t ON tp.tratamiento_id = t.id
        WHERE tp.usuario_id = ? AND tp.estado IN ('en progreso', 'pendiente');
    `;
    const [rows] = await db.query(query, [usuarioId]);
    return rows;
};