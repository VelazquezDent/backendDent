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
    console.log(`✔️ Se insertaron ${pagos.length} pagos.`);
};