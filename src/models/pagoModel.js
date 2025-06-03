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

