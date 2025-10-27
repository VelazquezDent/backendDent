const db = require('../db');

// 🔹 Obtener logros obtenidos por un usuario
exports.obtenerLogrosUsuario = async (usuarioId) => {
    const [rows] = await db.execute(
        `
        SELECT 
            lp.logro_id,
            lc.clave,
            lc.nombre,
            lc.descripcion,
            lp.fecha_obtencion
        FROM logros_pacientes lp
        INNER JOIN logros_catalogo lc ON lc.id = lp.logro_id
        WHERE lp.usuario_id = ?
        ORDER BY lp.fecha_obtencion DESC;
        `,
        [usuarioId]
    );
    return rows;
};

// 🔹 Listar catálogo completo de logros (admin)
exports.listarLogrosCatalogo = async () => {
    const [rows] = await db.execute(
        `
        SELECT 
            id,
            clave,
            nombre,
            descripcion,
            condicion_json,
            activo,
            fecha_creacion
        FROM logros_catalogo
        ORDER BY id ASC;
        `
    );
    return rows;
};

// 🔹 Crear nuevo logro (admin)
exports.crearLogroCatalogo = async (logro) => {
    const { clave, nombre, descripcion, condicion_json, activo } = logro;
    const [result] = await db.execute(
        `
        INSERT INTO logros_catalogo
        (clave, nombre, descripcion, condicion_json, activo, fecha_creacion)
        VALUES (?, ?, ?, ?, ?, NOW());
        `,
        [clave, nombre, descripcion, condicion_json, activo ?? 1]
    );
    return result.insertId;
};

// 🔹 Actualizar logro existente (admin)
exports.actualizarLogroCatalogo = async (id, logro) => {
    const { clave, nombre, descripcion, condicion_json, activo } = logro;
    await db.execute(
        `
        UPDATE logros_catalogo
        SET 
            clave = ?,
            nombre = ?,
            descripcion = ?,
            condicion_json = ?,
            activo = ?
        WHERE id = ?;
        `,
        [clave, nombre, descripcion, condicion_json, activo ?? 1, id]
    );
};

// 🔹 Verificar si el usuario ya tiene un logro
exports.usuarioTieneLogro = async (usuarioId, logroId) => {
    const [rows] = await db.execute(
        `SELECT 1 FROM logros_pacientes WHERE usuario_id = ? AND logro_id = ? LIMIT 1;`,
        [usuarioId, logroId]
    );
    return rows.length > 0;
};

// 🔹 Insertar nuevo logro al usuario
exports.asignarLogroUsuario = async (usuarioId, logroId) => {
    await db.execute(
        `
        INSERT INTO logros_pacientes (usuario_id, logro_id, fecha_obtencion)
        VALUES (?, ?, NOW());
        `,
        [usuarioId, logroId]
    );
};

// 🔹 Obtener catálogo activo (para evaluar logros automáticos)
exports.obtenerCatalogoActivo = async () => {
    const [rows] = await db.execute(
        `SELECT id, clave, condicion_json FROM logros_catalogo WHERE activo = 1;`
    );
    return rows;
};

exports.consultaAsistenciaPerfecta = async (usuarioId) => {
    // total de citas del usuario EN ESTE MES
    const [totalCitas] = await db.execute(
        `
        SELECT COUNT(*) AS total
        FROM citas c
        INNER JOIN tratamientos_pacientes tp ON tp.id = c.tratamiento_paciente_id
        WHERE tp.usuario_id = ?
        AND MONTH(c.fecha_hora) = MONTH(CURRENT_DATE())
        AND YEAR(c.fecha_hora) = YEAR(CURRENT_DATE())
        AND c.fecha_hora IS NOT NULL;
        `,
        [usuarioId]
    );

    // citas que sí asistió
    const [asistidas] = await db.execute(
        `
        SELECT COUNT(*) AS asistidas
        FROM citas c
        INNER JOIN tratamientos_pacientes tp ON tp.id = c.tratamiento_paciente_id
        WHERE tp.usuario_id = ?
        AND MONTH(c.fecha_hora) = MONTH(CURRENT_DATE())
        AND YEAR(c.fecha_hora) = YEAR(CURRENT_DATE())
        AND c.fecha_hora IS NOT NULL
        AND c.estado = 'completada';
        `,
        [usuarioId]
    );

    return {
        total: totalCitas[0].total || 0,
        asistidas: asistidas[0].asistidas || 0,
    };
};

exports.consultaCitasPuntuales = async (usuarioId, cantidad) => {
    const [rows] = await db.execute(
        `
        SELECT fecha_movimiento
        FROM puntos_movimientos
        WHERE usuario_id = ?
        AND motivo = 'CITA_PUNTUAL'          -- <- aquí el cambio importante
        ORDER BY fecha_movimiento DESC
        LIMIT ?;
        `,
        [usuarioId, cantidad]
    );

    // tiene que tener al menos N registros de puntualidad
    return rows.length >= cantidad;
};


exports.consultaTratamientoFinalizado = async (usuarioId) => {
    const [rows] = await db.execute(
        `
        SELECT 1 
        FROM tratamientos_pacientes
        WHERE usuario_id = ?
        AND estado = 'terminado'   -- <- ESTE ES EL ESTADO REAL QUE VI EN TU TABLA
        LIMIT 1;
        `,
        [usuarioId]
    );
    return rows.length > 0;
};

exports.consultaAniosActivo = async (usuarioId, anios) => {
    const [rows] = await db.execute(
        `
        SELECT 
            TIMESTAMPDIFF(YEAR, fecha_creacion, NOW()) AS anios
        FROM usuarios
        WHERE id = ?
        LIMIT 1;
        `,
        [usuarioId]
    );
    return rows.length > 0 && rows[0].anios >= anios;
};
