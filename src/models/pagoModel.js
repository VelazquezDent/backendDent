const db = require('../db');

exports.crearPago = async (pago, connection) => {
    const query = `INSERT INTO pagos (usuario_id, paciente_id, cita_id, monto, metodo, estado, fecha_pago) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    const values = [
        pago.usuarioId,
        pago.pacienteId,
        pago.citaId,
        pago.monto,
        pago.metodo,
        pago.estado,
        pago.fechaPago
    ];

    const [result] = await connection.query(query, values);
    return { id: result.insertId, ...pago };
};

exports.crearPagos = async (pagos, connection) => {
    if (!pagos || pagos.length === 0) {
        console.log("⚠️ No hay pagos para insertar.");
        return;
    }

    const query = `
        INSERT INTO pagos (usuario_id, paciente_id, cita_id, monto, metodo, estado, fecha_pago) 
        VALUES ?
    `;

    const values = pagos.map(pago => [
        pago.usuarioId,
        pago.pacienteId,
        pago.citaId,
        pago.monto,
        pago.metodo,
        pago.estado,
        pago.fechaPago
    ]);

    await connection.query(query, [values]);
    console.log(`✔️ Se insertaron ${pagos.length} pagos.`);
};

exports.crearNuevosPagos = async (pagos, connection) => {
    if (!pagos || pagos.length === 0) {
        console.log("⚠️ No hay pagos para insertar. Se omite la consulta.");
        return;
    }

    const query = `INSERT INTO pagos (usuario_id, paciente_id, cita_id, monto, metodo, estado, fecha_pago) VALUES ?`;
    
    const values = pagos.map(pago => [
        pago.usuarioId,
        pago.pacienteId,
        pago.citaId,
        pago.monto,
        pago.metodo,
        pago.estado,
        pago.fechaPago
    ]);

    await connection.query(query, [values]);
    console.log(`✔️ Se insertaron ${pagos.length} nuevos pagos.`);
};
exports.obtenerNuevosPagosPorTratamiento = async (tratamientoPacienteId, connection) => {
    const query = `
        SELECT p.id 
        FROM pagos p
        JOIN citas c ON p.cita_id = c.id
        WHERE c.tratamiento_paciente_id = ?;
    `;
    const [rows] = await connection.query(query, [tratamientoPacienteId]);
    return rows;
};
exports.obtenerPagosPorCitas = async (citaIds, connection) => {
    if (citaIds.length === 0) return [];

    const query = `SELECT id, cita_id FROM pagos WHERE cita_id IN (?)`;
    const [rows] = await connection.query(query, [citaIds]);
    return rows;
};

exports.actualizarMontoPago = async (pagoId, nuevoMonto, connection) => {
    const query = `UPDATE pagos SET monto = ? WHERE id = ?`;
    await connection.query(query, [nuevoMonto, pagoId]);
    console.log(`✔️ Pago ${pagoId} actualizado con monto: ${nuevoMonto}`);
};
exports.obtenerPagosPendientesPorUsuario = async (usuarioId, connection) => {
    const query = `
        SELECT p.*, c.fecha_hora, c.estado AS estado_cita
        FROM pagos p
        JOIN citas c ON p.cita_id = c.id
        WHERE p.usuario_id = ? AND p.estado = 'pendiente';
    `;
    const [rows] = await connection.query(query, [usuarioId]);
    return rows;
};
exports.obtenerPacientesConTratamientoActivo = async () => {
    const [result] = await db.query(`
        SELECT tp.id AS tratamiento_paciente_id,
               tp.usuario_id,
               tp.paciente_id,
               CASE 
                   WHEN tp.usuario_id IS NOT NULL THEN 'web'
                   ELSE 'sin_plataforma'
               END AS tipo_paciente,
               COALESCE(u.nombre, p.nombre) AS nombre,
               COALESCE(u.apellido_paterno, p.apellido_paterno) AS apellido_paterno,
               COALESCE(u.apellido_materno, p.apellido_materno) AS apellido_materno
        FROM tratamientos_pacientes tp
        LEFT JOIN usuarios u ON tp.usuario_id = u.id
        LEFT JOIN pacientes_sin_plataforma p ON tp.paciente_id = p.id
        WHERE tp.estado = 'en progreso'
    `);
    return result;
};
exports.actualizarPagosYMarcarCitas = async (ids, metodo, fecha_pago, connection) => {
    if (!ids || ids.length === 0) return;

    // 1. Actualiza los pagos y fuerza el estado como 'pagado'
    const queryPagos = `
        UPDATE pagos 
        SET metodo = ?, fecha_pago = ?, estado = 'pagado'
        WHERE id IN (?)
    `;
    await connection.query(queryPagos, [metodo, fecha_pago, ids]);

    // 2. Obtiene los ID de citas relacionadas
    const [pagos] = await connection.query(
        `SELECT cita_id FROM pagos WHERE id IN (?)`,
        [ids]
    );

    const citaIds = pagos.map(p => p.cita_id).filter(id => id);
    if (citaIds.length > 0) {
        // 3. Marca citas como pagadas
        await connection.query(
            `UPDATE citas SET pagada = 1 WHERE id IN (?)`,
            [citaIds]
        );
    }

    return { pagosActualizados: ids.length, citasActualizadas: citaIds.length };
};
exports.obtenerHistorialPagos = async () => {
    const query = `
        SELECT 
            p.id AS pago_id,
            p.fecha_pago,
            p.monto,
            p.metodo,
            p.estado,
            CONCAT_WS(' ', COALESCE(u.nombre, ps.nombre), COALESCE(u.apellido_paterno, ps.apellido_paterno), COALESCE(u.apellido_materno, ps.apellido_materno)) AS nombre_paciente,
            t.nombre AS nombre_tratamiento,
            c.id AS cita_id,
            c.fecha_hora AS fecha_cita
        FROM pagos p
        LEFT JOIN usuarios u ON p.usuario_id = u.id
        LEFT JOIN pacientes_sin_plataforma ps ON p.paciente_id = ps.id
        LEFT JOIN citas c ON p.cita_id = c.id
        LEFT JOIN tratamientos_pacientes tp ON c.tratamiento_paciente_id = tp.id
        LEFT JOIN tratamientos t ON tp.tratamiento_id = t.id
        WHERE p.estado = 'pagado'
        ORDER BY p.fecha_pago DESC
    `;
    const [rows] = await db.query(query);
    return rows;
};
exports.obtenerHistorialPagosPorUsuario = async (usuarioId) => {
    const query = `
        SELECT 
            p.id AS pago_id,
            p.fecha_pago,
            p.monto,
            p.metodo,
            p.estado,
            CONCAT_WS(' ', COALESCE(u.nombre, ps.nombre), COALESCE(u.apellido_paterno, ps.apellido_paterno), COALESCE(u.apellido_materno, ps.apellido_materno)) AS nombre_paciente,
            t.nombre AS nombre_tratamiento,
            c.id AS cita_id,
            c.fecha_hora AS fecha_cita
        FROM pagos p
        LEFT JOIN usuarios u ON p.usuario_id = u.id
        LEFT JOIN pacientes_sin_plataforma ps ON p.paciente_id = ps.id
        LEFT JOIN citas c ON p.cita_id = c.id
        LEFT JOIN tratamientos_pacientes tp ON c.tratamiento_paciente_id = tp.id
        LEFT JOIN tratamientos t ON tp.tratamiento_id = t.id
        WHERE p.estado = 'pagado' AND p.usuario_id = ?
        ORDER BY p.fecha_pago DESC
    `;
    const [rows] = await db.query(query, [usuarioId]);
    return rows;
};
exports.pagarPagosPorIds = async (pagosIds, connection) => {
    if (!pagosIds || pagosIds.length === 0) {
        return { pagos: [], citaIds: [] };
    }

    const [pagos] = await connection.query(
        `SELECT id, cita_id FROM pagos WHERE id IN (?) AND estado = 'pendiente'`,
        [pagosIds]
    );

    if (pagos.length === 0) return { pagos: [], citaIds: [] };

    const ids = pagos.map(p => p.id);
    const citaIds = pagos.map(p => p.cita_id);
    const fecha = new Date();
    const metodo = 'tarjeta';

    await connection.query(
        `UPDATE pagos SET metodo = ?, fecha_pago = ?, estado = 'pagado' WHERE id IN (?)`,
        [metodo, fecha, ids]
    );

    if (citaIds.length > 0) {
        await connection.query(
            `UPDATE citas SET pagada = 1 WHERE id IN (?)`,
            [citaIds]
        );
    }

    return { pagos: ids, citaIds, fecha };
};
