const db = require('../db');

exports.crearTratamientoPaciente = async (data, connection) => {
    const query = `
        INSERT INTO tratamientos_pacientes 
        (usuario_id, paciente_id, tratamiento_id, citas_totales, citas_asistidas, estado, fecha_inicio) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [data.usuarioId, data.pacienteId, data.tratamientoId, data.citasTotales, 0, data.estado, data.fechaInicio];
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
exports.tieneTratamientoActivoTipo = async (id, tipo) => {
    let query = `
        SELECT id, estado FROM tratamientos_pacientes 
        WHERE ${tipo === 'usuario' ? 'usuario_id' : 'paciente_id'} = ? 
        AND estado IN ('en progreso', 'pendiente')
    `;

    const [rows] = await db.query(query, [id]);
    return rows.length > 0 ? rows[0] : null;
};
exports.haCompletadoTratamientoTipo = async (id, tipo) => {
    let query = `
        SELECT id FROM tratamientos_pacientes 
        WHERE ${tipo === 'usuario' ? 'usuario_id' : 'paciente_id'} = ? 
        AND estado = 'terminado'
    `;

    const [rows] = await db.query(query, [id]);
    return rows.length > 0;
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
exports.obtenerTratamientoPorId = async (tratamientoPacienteId, connection) => {
    const query = `
        SELECT usuario_id, paciente_id, citas_totales, estado 
        FROM tratamientos_pacientes 
        WHERE id = ? 
        LIMIT 1;
    `;
    const [rows] = await connection.query(query, [tratamientoPacienteId]);
    return rows.length > 0 ? rows[0] : null;
};

exports.actualizarCitasTotalesYEstado = async (tratamientoPacienteId, citasTotales, estado, connection) => {
    const query = `
        UPDATE tratamientos_pacientes 
        SET citas_totales = ?, estado = ? 
        WHERE id = ?;
    `;
    await connection.query(query, [citasTotales, estado, tratamientoPacienteId]);
    console.log(`✔️ Tratamiento ${tratamientoPacienteId} actualizado: citas_totales = ${citasTotales}, estado = ${estado}`);
};

exports.obtenerHistorialTratamientos = async () => {
    const query = `
        SELECT 
            tp.id AS tratamiento_id,
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
            DATE_FORMAT(tp.fecha_finalizacion, '%Y-%m-%d') AS fecha_finalizacion,

            CAST(
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'cita_id', c.id,
                        'fecha_cita', c.fecha_hora,
                        'estado_cita', c.estado,
                        'cita_pagada', c.pagada,
                        'cita_comentario', c.comentario
                    )
                ) AS CHAR
            ) AS citas,

            CAST(
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'pago_id', pgo.id,
                        'monto_pago', pgo.monto,
                        'metodo_pago', pgo.metodo,
                        'estado_pago', pgo.estado,
                        'fecha_pago', DATE_FORMAT(pgo.fecha_pago, '%Y-%m-%d')
                    )
                ) AS CHAR
            ) AS pagos

        FROM tratamientos_pacientes tp
        LEFT JOIN usuarios u ON tp.usuario_id = u.id
        LEFT JOIN pacientes_sin_plataforma p ON tp.paciente_id = p.id
        JOIN tratamientos t ON tp.tratamiento_id = t.id
        LEFT JOIN citas c ON c.tratamiento_paciente_id = tp.id
        LEFT JOIN pagos pgo ON pgo.cita_id = c.id
        WHERE tp.estado = 'terminado'
        GROUP BY tp.id, u.id, p.id, t.id
        ORDER BY tp.fecha_finalizacion DESC;
    `;

    const [rows] = await db.query(query);

    // Convertir las cadenas JSON en arreglos reales
    const result = rows.map(row => ({
        ...row,
        citas: JSON.parse(row.citas || '[]'),
        pagos: JSON.parse(row.pagos || '[]')
    }));

    return result;
};
exports.obtenerHistorialPorUsuario = async (usuario_id) => {
    const query = `
        SELECT 
            tp.id AS tratamiento_id,
            u.id AS paciente_id,
            u.nombre,
            u.apellido_paterno,
            u.apellido_materno,
            u.telefono,
            u.email,
            TIMESTAMPDIFF(YEAR, u.fecha_nacimiento, CURDATE()) AS edad,
            u.sexo,
            t.nombre AS tratamiento_nombre,
            tp.citas_totales, 
            tp.citas_asistidas, 
            tp.estado, 
            DATE_FORMAT(tp.fecha_inicio, '%Y-%m-%d') AS fecha_inicio, 
            DATE_FORMAT(tp.fecha_finalizacion, '%Y-%m-%d') AS fecha_finalizacion,

            CAST(
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'cita_id', c.id,
                        'fecha_cita', c.fecha_hora,
                        'estado_cita', c.estado,
                        'cita_pagada', c.pagada,
                        'cita_comentario', c.comentario
                    )
                ) AS CHAR
            ) AS citas,

            CAST(
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'pago_id', pgo.id,
                        'monto_pago', pgo.monto,
                        'metodo_pago', pgo.metodo,
                        'estado_pago', pgo.estado,
                        'fecha_pago', DATE_FORMAT(pgo.fecha_pago, '%Y-%m-%d')
                    )
                ) AS CHAR
            ) AS pagos

        FROM tratamientos_pacientes tp
        JOIN usuarios u ON tp.usuario_id = u.id
        JOIN tratamientos t ON tp.tratamiento_id = t.id
        LEFT JOIN citas c ON c.tratamiento_paciente_id = tp.id
        LEFT JOIN pagos pgo ON pgo.cita_id = c.id
        WHERE tp.estado = 'terminado' AND tp.usuario_id = ?
        GROUP BY tp.id, u.id, t.id
        ORDER BY tp.fecha_finalizacion DESC;
    `;

    const [rows] = await db.query(query, [usuario_id]);

    // Convertir las cadenas JSON en arreglos reales
    const result = rows.map(row => ({
        ...row,
        citas: JSON.parse(row.citas || '[]'),
        pagos: JSON.parse(row.pagos || '[]')
    }));

    return result;
};
