const db = require('../db');

exports.crearCita = async (cita, connection) => {
    const query = `INSERT INTO citas (tratamiento_paciente_id, fecha_hora, estado, pagada) VALUES (?, ?, ?, ?)`;

    const values = [
        cita.tratamientoPacienteId,
        cita.fechaHora,
        cita.estado,
        cita.pagada
    ];

    const [result] = await connection.query(query, values);
    return { id: result.insertId, ...cita };
};

exports.crearCitas = async (citas, connection) => {
    if (!citas || citas.length === 0) {
        console.warn("No hay citas para insertar.");
        return;
    }

    const query = `INSERT INTO citas (tratamiento_paciente_id, fecha_hora, estado, pagada) VALUES ?`;

    const values = citas.map(cita => [
        cita.tratamientoPacienteId,
        cita.fechaHora,
        cita.estado,
        cita.pagada
    ]);

    await connection.query(query, [values]);
    console.log(`✔️ Se insertaron ${citas.length} citas.`);
};

exports.obtenerCitasPorTratamiento = async (tratamientoPacienteId, connection) => {
    const query = `SELECT * FROM citas WHERE tratamiento_paciente_id = ?`;
    const [rows] = await connection.query(query, [tratamientoPacienteId]);

    console.log(" Citas recuperadas en obtenerCitasPorTratamiento:", rows);
    return rows;
};

exports.obtenerCitasPorUsuario = async (usuarioId) => {
    const query = `
        SELECT 
            c.id,
            CASE 
                WHEN c.fecha_hora IS NULL OR c.fecha_hora = '0000-00-00 00:00:00' THEN NULL
                ELSE DATE_FORMAT(c.fecha_hora, '%Y-%m-%d %H:%i:%s')
            END AS fecha_hora,
            
            -- Mantener el estado tal cual está en la base de datos (puede ser NULL)
            c.estado AS estado_cita,

            -- Manejar el estado del pago
            CASE 
                WHEN c.pagada = 1 THEN 'Pagado'
                ELSE 'No pagado'
            END AS estado_pago

        FROM citas c
        JOIN tratamientos_pacientes tp ON c.tratamiento_paciente_id = tp.id
        WHERE tp.usuario_id = ? 
          AND tp.estado IN ('en progreso', 'pendiente') -- Incluir tratamientos en progreso o pendientes
        ORDER BY c.id ASC;
    `;

    const [citas] = await db.execute(query, [usuarioId]);

    return citas.map(cita => ({
        ...cita,
        fecha_hora: cita.fecha_hora || null, // Ya viene como cadena del DATE_FORMAT
        estado_cita: cita.estado_cita // Mantener NULL si está en la BD
    }));
};
// 👇 NUEVA FUNCIÓN: obtenerCitasPorUsuarioConTratamiento
exports.obtenerCitasPorUsuarioConTratamiento = async (usuarioId) => {
    const query = `
    SELECT 
        c.id AS cita_id,
        CASE 
            WHEN c.fecha_hora IS NULL OR c.fecha_hora = '0000-00-00 00:00:00' THEN NULL
            ELSE DATE_FORMAT(c.fecha_hora, '%Y-%m-%d %H:%i:%s')
        END AS fecha_hora,

        c.estado AS estado_cita,

        CASE 
            WHEN c.pagada = 1 THEN 'Pagado'
            ELSE 'No pagado'
        END AS estado_pago,

        t.nombre AS tratamiento,
        tp.estado AS estado_tratamiento
    FROM citas c
    JOIN tratamientos_pacientes tp ON c.tratamiento_paciente_id = tp.id
    JOIN tratamientos t ON tp.tratamiento_id = t.id
    WHERE tp.usuario_id = ?
      AND tp.estado IN ('en progreso', 'pendiente')  -- tratamientos activos
    ORDER BY c.fecha_hora ASC;
  `;

    const [citas] = await db.execute(query, [usuarioId]);

    return citas.map((cita) => ({
        ...cita,
        fecha_hora: cita.fecha_hora || null,
        estado_cita: cita.estado_cita,        // puede ser NULL
        tratamiento: cita.tratamiento?.trim() // por si viene con espacios
    }));
};

exports.obtenerProximasCitas = async () => {
    const query = `
        SELECT 
            c.id AS cita_id,
            DATE_FORMAT(c.fecha_hora, '%Y-%m-%d %H:%i:%s') AS fecha_hora,
            COALESCE(c.estado, NULL) AS estado_cita,
            CASE 
                WHEN c.pagada = 1 THEN 'Pagado'
                ELSE 'No pagado'
            END AS estado_pago,
            
            -- Agregamos el nombre del tratamiento
            t.nombre AS nombre_tratamiento,

            -- Datos del paciente
            CASE 
                WHEN tp.usuario_id IS NOT NULL THEN u.nombre
                ELSE p.nombre
            END AS nombre,
            CASE 
                WHEN tp.usuario_id IS NOT NULL THEN u.apellido_paterno
                ELSE p.apellido_paterno
            END AS apellido_paterno,
            CASE 
                WHEN tp.usuario_id IS NOT NULL THEN u.email
                ELSE p.email
            END AS email,
            CASE 
                WHEN tp.usuario_id IS NOT NULL THEN u.telefono
                ELSE p.telefono
            END AS telefono

        FROM citas c
        JOIN tratamientos_pacientes tp ON c.tratamiento_paciente_id = tp.id
        JOIN tratamientos t ON tp.tratamiento_id = t.id
        LEFT JOIN usuarios u ON tp.usuario_id = u.id
        LEFT JOIN pacientes_sin_plataforma p ON tp.paciente_id = p.id
        WHERE 
            c.fecha_hora IS NOT NULL
            AND c.fecha_hora != '0000-00-00 00:00:00'
            AND c.estado NOT IN ('cancelado', 'cancelada')     -- Excluir canceladas
            AND tp.estado NOT IN ('cancelado', 'terminado')    -- Excluir tratamientos finalizados o cancelados
        ORDER BY c.fecha_hora ASC;
    `;

    const [citas] = await db.execute(query);
    return citas;
};


exports.obtenerCitasActivas = async () => {
    const query = `
        SELECT 
            fecha_hora, 
            estado
            FROM citas
        WHERE estado = 'pendiente'
        AND fecha_hora IS NOT NULL
        ORDER BY fecha_hora ASC;
    `;

    const [citas] = await db.execute(query);
    return citas;
};

exports.obtenerCitasPorTratamiento = async (tratamientoPacienteId) => {
    const query = `
        SELECT * 
        FROM citas 
        WHERE tratamiento_paciente_id = ? 
        ORDER BY 
            CASE 
                WHEN fecha_hora IS NULL THEN 1 ELSE 0 
            END, 
            fecha_hora ASC, 
            id ASC
    `;
    const [rows] = await db.execute(query, [tratamientoPacienteId]);
    return rows;
};

exports.crearNuevasCitas = async (citas, connection) => {
    if (!citas || citas.length === 0) {
        console.warn("No hay citas para insertar.");
        return;
    }

    const query = `INSERT INTO citas (tratamiento_paciente_id, fecha_hora, estado, pagada) VALUES ?`;

    const values = citas.map(cita => [
        cita.tratamientoPacienteId,
        cita.fechaHora,
        cita.estado,
        cita.pagada
    ]);

    await connection.query(query, [values]);
    console.log(`✔️ Se insertaron ${citas.length} nuevas citas.`);
};

exports.obtenerNuevasCitasPorTratamiento = async (tratamientoPacienteId, connection) => {
    const query = `SELECT * FROM citas WHERE tratamiento_paciente_id = ? ORDER BY id ASC`;
    const [rows] = await connection.query(query, [tratamientoPacienteId]);
    return rows;
};

exports.actualizarFechaHoraCita = async (id, fechaHora) => {
    const query = `
        UPDATE citas 
        SET fecha_hora = ?, estado = 'pendiente'
        WHERE id = ? AND fecha_hora IS NULL;
    `;
    const [resultado] = await db.execute(query, [fechaHora, id]);
    return resultado;
};
// Obtener una cita por ID
exports.obtenerCitaPorId = async (id) => {
    const query = `SELECT * FROM citas WHERE id = ?`;
    const [rows] = await db.execute(query, [id]);
    return rows.length > 0 ? rows[0] : null;
};
// Marcar cita como completada y aumentar citas asistidas
exports.marcarCitaComoCompletada = async (id, comentario) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Marcar cita como completada
        const updateCitaQuery = `
            UPDATE citas 
            SET estado = 'completada', comentario = ?
            WHERE id = ?;
        `;
        await connection.execute(updateCitaQuery, [comentario, id]);

        // 2. Obtener el tratamiento_paciente_id desde la cita
        const getCitaQuery = `SELECT tratamiento_paciente_id FROM citas WHERE id = ?`;
        const [citaResult] = await connection.execute(getCitaQuery, [id]);
        if (!citaResult.length) throw new Error("Cita no encontrada");

        const tratamientoPacienteId = citaResult[0].tratamiento_paciente_id;

        // 3. Obtener datos actuales del tratamiento
        const getTratamientoQuery = `
            SELECT citas_asistidas, citas_totales 
            FROM tratamientos_pacientes 
            WHERE id = ?;
        `;
        const [tratamientoResult] = await connection.execute(getTratamientoQuery, [tratamientoPacienteId]);
        if (!tratamientoResult.length) throw new Error("Tratamiento del paciente no encontrado");

        const { citas_asistidas, citas_totales } = tratamientoResult[0];

        // 4. Aumentar citas asistidas si aún no se alcanza el total
        if (citas_asistidas < citas_totales) {
            await connection.execute(`
                UPDATE tratamientos_pacientes 
                SET citas_asistidas = citas_asistidas + 1 
                WHERE id = ?;
            `, [tratamientoPacienteId]);
        }

        // 5. Verificar si ya están completas todas las citas
        const nuevasAsistidas = citas_asistidas + 1;
        if (nuevasAsistidas >= citas_totales) {
            await connection.execute(`
                UPDATE tratamientos_pacientes 
                SET estado = 'terminado',
                    fecha_finalizacion = CURRENT_DATE()
                WHERE id = ?;
            `, [tratamientoPacienteId]);
        }

        await connection.commit();
        return { success: true, mensaje: 'Cita completada y tratamiento actualizado' };
    } catch (error) {
        await connection.rollback();
        console.error(" Error al completar cita:", error);
        return { success: false, mensaje: 'Error al completar cita', error };
    } finally {
        connection.release();
    }
};

exports.actualizarFechaHoraCita = async (id, fechaHora) => {
    // Primero obtenemos la información actual de la cita
    const querySelect = `SELECT estado, pagada FROM citas WHERE id = ?`;
    const [cita] = await db.execute(querySelect, [id]);

    if (!cita || cita.length === 0) {
        return { error: true, message: "La cita no existe." };
    }

    // Verificamos si la cita está completada y pagada
    if (cita[0].estado === 'completada' && cita[0].pagada === 1) {
        return { error: true, message: "No se puede actualizar una cita completada y pagada." };
    }

    // Si la cita no está completada o no está pagada, se permite la actualización
    const queryUpdate = `
        UPDATE citas 
        SET fecha_hora = ?, estado = 'pendiente'
        WHERE id = ?;
    `;

    const [resultado] = await db.execute(queryUpdate, [fechaHora, id]);

    return resultado;
};

exports.obtenerNotificacionesCitas = async () => {
    const query = `
        SELECT id, fecha_hora
        FROM citas
        WHERE DATE(fecha_hora) IN (CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 DAY))
        ORDER BY fecha_hora ASC;
    `;

    const [citas] = await db.execute(query);
    return citas;
};

exports.obtenerCitaPorTratamiento = async (tratamiento_paciente_id) => {
    const [result] = await db.query(`
    SELECT 
        t.nombre AS nombre_tratamiento,
        c.id AS cita_id,
        c.fecha_hora,
        c.comentario,
        c.pagada,
        IFNULL(p.estado, 'pendiente') AS estado_pago,
        IFNULL(p.metodo, NULL) AS metodo,
        IFNULL(p.monto, 0) AS monto,
        p.id AS pago_id -- Campo que necesitas para el frontend
    FROM tratamientos_pacientes tp
    INNER JOIN tratamientos t ON tp.tratamiento_id = t.id
    INNER JOIN citas c ON c.tratamiento_paciente_id = tp.id
    LEFT JOIN pagos p ON p.cita_id = c.id
    WHERE tp.id = ?
    ORDER BY c.fecha_hora
  `, [tratamiento_paciente_id]);

    return result;
};

exports.obtenerCitasPorFecha = async (fecha) => {
    const query = `
        SELECT 
            c.id AS cita_id,
            c.fecha_hora,
            COALESCE(u.nombre, p.nombre) AS nombre_paciente,
            COALESCE(u.apellido_paterno, p.apellido_paterno) AS apellido_paterno,
            COALESCE(u.apellido_materno, p.apellido_materno) AS apellido_materno,
            t.nombre AS tratamiento
        FROM citas c
        JOIN tratamientos_pacientes tp ON c.tratamiento_paciente_id = tp.id
        LEFT JOIN usuarios u ON tp.usuario_id = u.id
        LEFT JOIN pacientes_sin_plataforma p ON tp.paciente_id = p.id
        JOIN tratamientos t ON tp.tratamiento_id = t.id
        WHERE DATE(c.fecha_hora) = ?
          AND c.fecha_hora IS NOT NULL
        ORDER BY c.fecha_hora ASC
    `;
    const [rows] = await db.execute(query, [fecha]);
    return rows;
};
exports.obtenerHistorialCitasPorUsuario = async (usuarioId) => {
    const query = `
    SELECT 
        c.id AS cita_id,
        DATE_FORMAT(c.fecha_hora, '%Y-%m-%d %H:%i:%s') AS fecha_hora,
        c.estado AS estado_cita,
        CASE 
            WHEN c.pagada = 1 THEN 'Pagado'
            ELSE 'No pagado'
        END AS estado_pago,
        t.nombre AS tratamiento,
        tp.estado AS estado_tratamiento
    FROM citas c
    JOIN tratamientos_pacientes tp ON c.tratamiento_paciente_id = tp.id
    JOIN tratamientos t ON tp.tratamiento_id = t.id
    WHERE 
        tp.usuario_id = ?
        AND c.estado IN ('cancelado', 'completada')  -- 🔹 Solo citas canceladas o completadas
        AND c.fecha_hora IS NOT NULL                 -- 🔹 Excluir citas sin fecha programada
    ORDER BY c.fecha_hora DESC;
  `;

    const [rows] = await db.execute(query, [usuarioId]);
    return rows;
};


