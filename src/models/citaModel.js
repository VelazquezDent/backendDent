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
        console.warn("⚠️ No hay citas para insertar.");
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

    console.log("📌 Citas recuperadas en obtenerCitasPorTratamiento:", rows);
    return rows;
};
exports.obtenerCitasPorUsuario = async (usuarioId) => {
    const query = `
        SELECT 
            c.id,
            CASE 
                WHEN c.fecha_hora IS NULL OR c.fecha_hora = '0000-00-00 00:00:00' THEN NULL
                ELSE CONVERT_TZ(c.fecha_hora, '+00:00', '-06:00') 
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
        ORDER BY c.id ASC;
    `;

    const [citas] = await db.execute(query, [usuarioId]);

    return citas.map(cita => ({
        ...cita,
        fecha_hora: cita.fecha_hora ? new Date(cita.fecha_hora).toISOString() : null,
        estado_cita: cita.estado_cita // Mantener NULL si está en la BD
    }));
};
exports.obtenerProximasCitas = async () => {
    const query = `
        SELECT 
            c.id AS cita_id,
            c.fecha_hora,
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
        JOIN tratamientos t ON tp.tratamiento_id = t.id  -- 🔹 JOIN para obtener el tratamiento
        LEFT JOIN usuarios u ON tp.usuario_id = u.id
        LEFT JOIN pacientes_sin_plataforma p ON tp.paciente_id = p.id
        WHERE c.fecha_hora IS NOT NULL 
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
        console.warn("⚠️ No hay citas para insertar.");
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

// Marcar cita como completada y agregar comentario
exports.marcarCitaComoCompletada = async (id, comentario) => {
    const query = `
        UPDATE citas 
        SET estado = 'completada', comentario = ? 
        WHERE id = ?;
    `;

    console.log("🛠️ Ejecutando consulta SQL:", query, "con valores:", [comentario, id]); // 🔹 LOG para debug

    const [resultado] = await db.execute(query, [comentario, id]);

    console.log("🔎 Resultado de la actualización:", resultado); // 🔹 LOG de resultado

    return resultado;
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

